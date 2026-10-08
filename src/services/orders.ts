import { db } from "@/lib/db";
import type { Locale } from "@/lib/business-rules";
import { DEFAULT_LOCALE, canTransition, type OrderStatus, type PaymentMethod, type PaymentStatus } from "@/lib/business-rules";
import {
  AppErrorBuilder,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import { formatMAD } from "@/lib/money";
import { prismaErrorToAppError } from "./prisma-errors";
import { priceCheckoutItems } from "./products";
import { validateCoupon, incrementCouponUsage, type CouponInvalidReason } from "./coupons";
import { computeTotals } from "./pricing";
import { getDeliveryQuote } from "./delivery";
import { getSettings, getRawSettings } from "./settings";
import { hostedCheckoutProvider, isHostedCheckoutConfigured } from "./payment";
import { enqueueEmail } from "./email/outbox";
import { statusToTemplate } from "./email/templates";

// ── Types ─────────────────────────────────────────────────────

export interface CreateOrderItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface CreateOrderInput {
  userId?: string | null;
  email?: string | null;
  fullName: string;
  phone: string;
  city: string;
  addressLine: string;
  customerNote?: string | null;
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
  items: CreateOrderItemInput[];
  locale?: Locale;
  /** Clears the caller's cart after the order commits. */
  cartId?: string | null;
}

export interface CreateOrderResult {
  orderId: string;
  orderNumber: string;
  totalMinor: number;
  subtotalMinor: number;
  discountMinor: number;
  deliveryFeeMinor: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  checkoutUrl: string | null;
}

export interface OrderListItemDTO {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalMinor: number;
  fullName: string;
  phone: string;
  city: string;
  itemCount: number;
  placedAt: Date;
}

// ── Order numbers ─────────────────────────────────────────────

function generateOrderNumber(): string {
  const now = new Date();
  const stamp =
    String(now.getFullYear()).slice(2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ARAS-${stamp}-${suffix}`;
}

// ── Create order ──────────────────────────────────────────────

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const locale = input.locale ?? DEFAULT_LOCALE;

  if (!input.items?.length) {
    throw new ValidationError("Your cart is empty", [{ path: "items", message: "Cart is empty" }]);
  }
  if (!input.fullName?.trim() || !input.phone?.trim() || !input.city?.trim() || !input.addressLine?.trim()) {
    throw new ValidationError("Missing delivery information", [
      { path: "fullName", message: "Full name, phone, city and address are required" },
    ]);
  }

  const { priced, originalSubtotalMinor } = await priceCheckoutItems(input.items);

  for (const item of priced) {
    if (item.quantity > item.stockAvailable) {
      throw AppErrorBuilder.outOfStock(
        item.stockAvailable === 0
          ? `"${item.name}" is out of stock`
          : `Only ${item.stockAvailable} left of "${item.name}"`,
      );
    }
  }

  const subtotalMinor = priced.reduce((sum, item) => sum + item.lineTotalMinor, 0);

  // Fail fast (before reserving stock) when card payment is unavailable.
  if (input.paymentMethod === "CARD" && !isHostedCheckoutConfigured()) {
    throw AppErrorBuilder.payment(
      "Card payments are not configured yet. Please choose Cash on Delivery.",
    );
  }

  // Coupon
  let coupon: { id: string; type: "PERCENT" | "FIXED"; value: number; code: string } | null = null;
  if (input.couponCode?.trim()) {
    const validation = await validateCoupon(input.couponCode, subtotalMinor);
    if (!validation.valid) {
      throw couponError(validation.reason);
    }
    coupon = {
      id: validation.coupon.id,
      type: validation.coupon.type,
      value: validation.coupon.value,
      code: validation.coupon.code,
    };
  }

  // Delivery
  const afterCoupon = subtotalMinor - (coupon ? Math.min(computeCouponPreview(coupon, subtotalMinor), subtotalMinor) : 0);
  const quote = await getDeliveryQuote(afterCoupon, input.city.trim());
  const settings = await getSettings(locale);

  const totals = computeTotals({
    items: priced.map((item) => ({ unitPriceMinor: item.unitPriceMinor, quantity: item.quantity })),
    originalSubtotalMinor,
    coupon: coupon ? { type: coupon.type, value: coupon.value } : null,
    zoneFeeMinor: quote.zoneFeeMinor,
    freeShippingThresholdMinor: settings.freeShippingThresholdMinor,
  });

  // Persist
  let created: { id: string; orderNumber: string };
  try {
    created = await db.$transaction(async (tx) => {
      // 1. Atomic stock reservation
      const affectedProductIds = new Set<string>();
      for (const item of priced) {
        if (item.variantId) {
          const updated = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw AppErrorBuilder.outOfStock(`"${item.name}" — not enough stock left`);
          }
          affectedProductIds.add(item.productId);
        } else {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw AppErrorBuilder.outOfStock(`"${item.name}" — not enough stock left`);
          }
        }
      }

      // 2. Recompute aggregate stock for variant products
      for (const productId of affectedProductIds) {
        const variants = await tx.productVariant.findMany({
          where: { productId },
          select: { stock: true },
        });
        const total = variants.reduce((sum, variant) => sum + variant.stock, 0);
        await tx.product.update({ where: { id: productId }, data: { stock: total } });
      }

      // 3. Order number (retry on the astronomically-unlikely collision)
      let orderNumber = generateOrderNumber();
      for (let attempt = 0; attempt < 5; attempt++) {
        const clash = await tx.order.findUnique({ where: { orderNumber }, select: { id: true } });
        if (!clash) break;
        orderNumber = generateOrderNumber();
      }

      // 4. Order + items + history + payment
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: input.userId ?? null,
          status: "NEW",
          paymentMethod: input.paymentMethod,
          paymentStatus: "PENDING",
          // Subtotal = sum of item line totals (promotion prices included);
          // discountAmount = order-level (coupon) discount only.
          subtotal: totals.subtotalMinor,
          deliveryFee: totals.deliveryFeeMinor,
          discountAmount: totals.couponDiscountMinor,
          total: totals.totalMinor,
          fullName: input.fullName.trim(),
          phone: input.phone.trim(),
          city: input.city.trim(),
          addressLine: input.addressLine.trim(),
          email: input.email?.trim() || null,
          couponCode: coupon?.code ?? null,
          customerNote: input.customerNote?.trim() || null,
          items: {
            create: priced.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.name,
              productSlug: item.slug,
              variantLabel: item.variantLabel,
              sku: item.sku,
              imageUrl: item.imageUrl,
              unitPrice: item.unitPriceMinor,
              quantity: item.quantity,
              total: item.lineTotalMinor,
            })),
          },
        },
      });

      await tx.orderStatusHistory.create({
        data: { orderId: order.id, toStatus: "NEW", actorName: "SYSTEM" },
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: input.paymentMethod === "COD" ? "COD" : "HOSTED",
          method: input.paymentMethod,
          amount: totals.totalMinor,
          status: "PENDING",
        },
      });

      if (coupon) {
        await incrementCouponUsage(tx, coupon.id);
      }

      // 5. Popularity counters
      const salesByProduct = new Map<string, number>();
      for (const item of priced) {
        salesByProduct.set(
          item.productId,
          (salesByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }
      for (const [productId, quantity] of salesByProduct) {
        await tx.product.update({
          where: { id: productId },
          data: { salesCount: { increment: quantity } },
        });
      }

      return { id: order.id, orderNumber: order.orderNumber };
    });
  } catch (error) {
    throw prismaErrorToAppError(error);
  }

  // 6. Post-commit: clear cart, emails, card redirect
  if (input.cartId) {
    await db.cartItem
      .deleteMany({ where: { cartId: input.cartId } })
      .catch(() => undefined);
    await db.cart
      .update({ where: { id: input.cartId }, data: { couponCode: null } })
      .catch(() => undefined);
  }

  await enqueueOrderEmails({
    orderId: created.id,
    orderNumber: created.orderNumber,
    totalMinor: totals.totalMinor,
    customerName: input.fullName.trim(),
    email: input.email?.trim() || null,
    userId: input.userId ?? null,
    locale,
    template: "order_created",
  }).catch((error) => console.error("[orders] enqueue failed:", error));

  let checkoutUrl: string | null = null;
  if (input.paymentMethod === "CARD") {
    try {
      const checkout = await hostedCheckoutProvider.createCheckout({
        orderId: created.id,
        orderNumber: created.orderNumber,
        amountMinor: totals.totalMinor,
        currency: "MAD",
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/checkout/result?order=${created.orderNumber}`,
        locale,
      });
      checkoutUrl = checkout.checkoutUrl;
      await db.payment.update({
        where: { orderId: created.id },
        data: {
          provider: checkout.provider,
          checkoutUrl: checkout.checkoutUrl,
          providerReference: checkout.providerReference,
        },
      });
    } catch (error) {
      // The order is already committed. Keep it, log the failure and let the
      // result page show a "payment pending / switch to COD" message.
      console.error("[orders] card checkout creation failed:", error);
      checkoutUrl = null;
    }
  }

  return {
    orderId: created.id,
    orderNumber: created.orderNumber,
    totalMinor: totals.totalMinor,
    subtotalMinor: totals.subtotalMinor,
    discountMinor: totals.discountMinor,
    deliveryFeeMinor: totals.deliveryFeeMinor,
    paymentMethod: input.paymentMethod,
    paymentStatus: "PENDING",
    checkoutUrl,
  };
}

function computeCouponPreview(
  coupon: { type: "PERCENT" | "FIXED"; value: number },
  subtotal: number,
): number {
  if (coupon.type === "PERCENT") return Math.round(subtotal * (coupon.value / 100));
  return Math.min(coupon.value, subtotal);
}

function couponError(reason: CouponInvalidReason): ValidationError {
  return new ValidationError("Invalid coupon", [
    { path: "couponCode", message: reason },
  ]);
}

// ── E-mails ───────────────────────────────────────────────────

async function enqueueOrderEmails(input: {
  orderId: string;
  orderNumber: string;
  totalMinor: number;
  customerName: string;
  email: string | null;
  userId: string | null;
  locale: Locale;
  template: "order_created" | "order_confirmed" | "order_preparing" | "order_shipped" | "order_delivered" | "order_cancelled";
}): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const trackingUrl = `${appUrl}/order/${input.orderNumber}`;

  let recipient = input.email;
  let recipientName = input.customerName;
  if (!recipient && input.userId) {
    const user = await db.user.findUnique({
      where: { id: input.userId },
      select: { email: true, name: true },
    });
    recipient = user?.email ?? null;
    recipientName = user?.name || input.customerName;
  }

  if (recipient) {
    await enqueueEmail({
      to: recipient,
      toName: recipientName,
      template: input.template,
      locale: input.locale,
      payload: {
        orderNumber: input.orderNumber,
        customerName: input.customerName,
        total: formatMAD(input.totalMinor),
        trackingUrl,
      },
    });
  }

  const settings = await getRawSettings();
  if (settings.contactEmail && input.template === "order_created") {
    await enqueueEmail({
      to: settings.contactEmail,
      template: "generic",
      locale: "fr",
      payload: {
        subject: `Nouvelle commande ${input.orderNumber}`,
        heading: `Nouvelle commande ${input.orderNumber}`,
        body: `Client: ${input.customerName} — ${formatMAD(input.totalMinor)} — ${input.locale.toUpperCase()}`,
        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/orders/${input.orderId}`,
        ctaLabel: "Voir la commande",
      },
    });
  }
}

// ── Status changes ────────────────────────────────────────────

export interface ActorInfo {
  id?: string | null;
  name?: string | null;
}

export async function changeOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  actor: ActorInfo = {},
  note?: string | null,
) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order not found");

  if (order.status === toStatus) return order;
  if (!canTransition(order.status, toStatus)) {
    throw new ConflictError(
      `Cannot move order from ${order.status} to ${toStatus}`,
    );
  }

  const nextPaymentStatus: PaymentStatus | undefined =
    toStatus === "DELIVERED" && order.paymentMethod === "COD"
      ? "PAID"
      : toStatus === "CANCELLED" && order.paymentStatus === "PENDING"
        ? "CANCELLED"
        : undefined;

  await db.$transaction([
    db.order.update({
      where: { id: orderId },
      data: {
        status: toStatus,
        ...(nextPaymentStatus ? { paymentStatus: nextPaymentStatus } : {}),
      },
    }),
    db.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus,
        note: note?.trim() || null,
        actorId: actor.id ?? null,
        actorName: actor.name ?? "Admin",
      },
    }),
    ...(nextPaymentStatus
      ? [
          db.payment.updateMany({
            where: { orderId, status: "PENDING" },
            data: { status: nextPaymentStatus },
          }),
        ]
      : []),
  ]);

  try {
    await enqueueOrderEmails({
      orderId,
      orderNumber: order.orderNumber,
      totalMinor: order.total,
      customerName: order.fullName,
      email: order.email,
      userId: order.userId,
      locale: DEFAULT_LOCALE,
      template: statusToTemplate(toStatus),
    });
  } catch (error) {
    console.error("[orders] status email failed:", error);
  }

  return db.order.findUnique({ where: { id: orderId } });
}

/** Webhook / admin helper: mark the payment (and order) as paid. */
export async function markPaymentPaid(
  orderId: string,
  providerReference?: string | null,
): Promise<void> {
  await db.$transaction([
    db.payment.updateMany({
      where: { orderId },
      data: { status: "PAID", ...(providerReference ? { providerReference } : {}) },
    }),
    db.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" },
    }),
  ]);
}

export async function markPaymentFailed(orderId: string): Promise<void> {
  await db.$transaction([
    db.payment.updateMany({ where: { orderId }, data: { status: "FAILED" } }),
    db.order.update({ where: { id: orderId }, data: { paymentStatus: "FAILED" } }),
  ]);
}

// ── Queries ───────────────────────────────────────────────────

export interface OrderAdminFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  q?: string;
  page?: number;
  perPage?: number;
}

export async function listOrdersAdmin(filters: OrderAdminFilters) {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));
  const perPage = Math.min(100, Math.max(1, Math.trunc(filters.perPage ?? 20)));

  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { fullName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        total: true,
        fullName: true,
        phone: true,
        city: true,
        placedAt: true,
        _count: { select: { items: true } },
      },
    }),
  ]);

  return {
    items: orders.map<OrderListItemDTO>((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      totalMinor: order.total,
      fullName: order.fullName,
      phone: order.phone,
      city: order.city,
      itemCount: order._count.items,
      placedAt: order.placedAt,
    })),
    total,
    page,
    pages: Math.ceil(total / perPage),
    perPage,
  };
}

export async function getOrderAdmin(id: string) {
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      history: { orderBy: { createdAt: "desc" } },
      payment: true,
      user: { select: { id: true, name: true, email: true } },
      coupon: true,
    },
  });
  if (!order) throw new NotFoundError("Order not found");
  return order;
}

export async function getOrderByNumber(orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      history: { orderBy: { createdAt: "asc" }, select: { toStatus: true, createdAt: true } },
      payment: { select: { method: true, status: true, checkoutUrl: true } },
    },
  });
}

export async function listCustomerOrders(userId: string, page = 1, perPage = 10) {
  const where = { userId };
  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (Math.max(1, page) - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        total: true,
        placedAt: true,
        items: { select: { productName: true, imageUrl: true, quantity: true } },
      },
    }),
  ]);

  return { items: orders, total, page, pages: Math.ceil(total / perPage) };
}

export async function updateOrderNotes(orderId: string, adminNotes: string | null): Promise<void> {
  const order = await db.order.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) throw new NotFoundError("Order not found");
  await db.order.update({ where: { id: orderId }, data: { adminNotes } });
}

/** Requeues a failed order e-mail (admin action on the order page). */
export async function resendOrderEmail(orderId: string, locale: Locale = DEFAULT_LOCALE): Promise<void> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order not found");

  await enqueueOrderEmails({
    orderId: order.id,
    orderNumber: order.orderNumber,
    totalMinor: order.total,
    customerName: order.fullName,
    email: order.email,
    userId: order.userId,
    locale,
    template: statusToTemplate(order.status),
  });
}
