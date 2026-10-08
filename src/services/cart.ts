import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import type { Locale } from "@/lib/business-rules";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/business-rules";
import { clampQuantity } from "@/lib/money";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { loadPromotionMap, promotionPercentFor, priceCheckoutItems } from "./products";
import { resolveSalePrice } from "./pricing";
import { validateCoupon, type CouponInvalidReason } from "./coupons";
import { computeTotals, type CartTotals } from "./pricing";
import { getSettings } from "./settings";

export const GUEST_CART_COOKIE = "aras_cart";

export interface CartContext {
  userId?: string | null;
  token?: string | null;
}

export interface CartItemDTO {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  image: string | null;
  variantLabel: string | null;
  unitPriceMinor: number;
  basePriceMinor: number;
  lineTotalMinor: number;
  quantity: number;
  stockAvailable: number;
  maxQuantity: number;
  onSale: boolean;
  discountPercent: number;
}

export interface CartDTO {
  id: string;
  items: CartItemDTO[];
  itemCount: number;
  subtotalMinor: number;
  originalSubtotalMinor: number;
  itemDiscountMinor: number;
  couponCode: string | null;
  couponDiscountMinor: number;
  couponReason: CouponInvalidReason | null;
  totals: CartTotals;
}

export function generateCartToken(): string {
  return `cart_${randomUUID()}`;
}

export async function getOrCreateCart(context: CartContext) {
  if (context.userId) {
    const userId = context.userId;
    const existing = await db.cart.findUnique({ where: { userId } });
    if (existing) return existing;
    return createCartUnique(() => db.cart.findUnique({ where: { userId } }), { userId });
  }

  if (context.token) {
    const token = context.token;
    const existing = await db.cart.findUnique({ where: { token } });
    if (existing) return existing;
    return createCartUnique(() => db.cart.findUnique({ where: { token } }), { token });
  }

  // No identity yet — create an anonymous cart the caller can persist as a cookie.
  return db.cart.create({ data: { token: generateCartToken() } });
}

/** Concurrent requests can race the unique constraint — retry the lookup once. */
type CartRow = Awaited<ReturnType<typeof db.cart.create>>;

async function createCartUnique(
  findExisting: () => Promise<CartRow | null>,
  data: Parameters<typeof db.cart.create>[0]["data"],
): Promise<CartRow> {
  try {
    return await db.cart.create({ data });
  } catch (error) {
    if (isUniqueViolation(error)) {
      const existing = await findExisting();
      if (existing) return existing;
    }
    throw error;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

async function loadCartOrFail(context: CartContext) {
  const cart = await getOrCreateCart(context);
  return cart;
}

export async function getCart(context: CartContext, locale: Locale = "fr"): Promise<CartDTO> {
  const cart = await loadCartOrFail(context);

  const [settings, promotions] = await Promise.all([getSettings(locale), loadPromotionMap()]);

  const rawItems = await db.cartItem.findMany({
    where: { cartId: cart.id },
    orderBy: { createdAt: "asc" },
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          subcategory: { select: { categoryId: true } },
        },
      },
      variant: { include: { options: true } },
    },
  });

  const items: CartItemDTO[] = [];
  let originalSubtotal = 0;

  for (const raw of rawItems) {
    const product = raw.product;
    const promo = promotionPercentFor(
      {
        id: product.id,
        categoryId: product.categoryId,
        subcategoryCategoryId: product.subcategory?.categoryId ?? null,
      },
      promotions,
    );

    const base = raw.variant?.price ?? product.price;
    const sale = resolveSalePrice(base, raw.variant ? null : product.compareAtPrice, promo);

    const quantity = clampQuantity(raw.quantity, MAX_QUANTITY_PER_ITEM);
    const stockAvailable = raw.variant ? raw.variant.stock : product.stock;
    const localizedName =
      locale === "ar" ? product.nameAr : locale === "en" ? product.nameEn : product.nameFr;

    items.push({
      id: raw.id,
      productId: product.id,
      variantId: raw.variantId,
      name: localizedName,
      slug: product.slug,
      image: product.images[0]?.url ?? null,
      variantLabel: raw.variant
        ? raw.variant.options.map((option) => option.value).join(" / ") || raw.variant.sku
        : null,
      unitPriceMinor: sale.priceMinor,
      basePriceMinor: base,
      lineTotalMinor: sale.priceMinor * quantity,
      quantity,
      stockAvailable,
      maxQuantity: Math.min(MAX_QUANTITY_PER_ITEM, Math.max(1, stockAvailable)),
      onSale: sale.onSale,
      discountPercent: sale.discountPercentValue,
    });

    originalSubtotal += base * quantity;
  }

  const subtotalMinor = items.reduce((sum, item) => sum + item.lineTotalMinor, 0);

  // Coupon (only when one is attached to the cart).
  let couponDiscountMinor = 0;
  let couponReason: CouponInvalidReason | null = null;
  if (cart.couponCode) {
    const validation = await validateCoupon(cart.couponCode, subtotalMinor);
    if (validation.valid) {
      couponDiscountMinor = validation.discountMinor;
    } else {
      couponReason = validation.reason;
    }
  }

  const totals = computeTotals({
    items: items.map((item) => ({ unitPriceMinor: item.unitPriceMinor, quantity: item.quantity })),
    originalSubtotalMinor: originalSubtotal,
    coupon: null,
    zoneFeeMinor: 0,
    freeShippingThresholdMinor: settings.freeShippingThresholdMinor,
  });

  const adjusted: CartTotals = {
    ...totals,
    couponDiscountMinor,
    discountMinor: couponDiscountMinor + totals.itemDiscountMinor,
    totalMinor: Math.max(0, subtotalMinor - couponDiscountMinor),
  };

  return {
    id: cart.id,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalMinor,
    originalSubtotalMinor: originalSubtotal,
    itemDiscountMinor: Math.max(0, originalSubtotal - subtotalMinor),
    couponCode: cart.couponCode,
    couponDiscountMinor,
    couponReason,
    totals: adjusted,
  };
}

export interface AddItemInput {
  productId: string;
  variantId?: string | null;
  quantity?: number;
}

export async function addCartItem(context: CartContext, input: AddItemInput): Promise<void> {
  const cart = await getOrCreateCart(context);
  const quantity = clampQuantity(input.quantity ?? 1, MAX_QUANTITY_PER_ITEM);
  const variantId = input.variantId ?? null;

  const product = await db.product.findFirst({
    where: { id: input.productId, status: "ACTIVE" },
    include: { variants: { where: variantId ? { id: variantId } : undefined } },
  });
  if (!product) throw new NotFoundError("Product not found");

  const variant = variantId ? product.variants[0] : undefined;
  if (variantId && !variant) throw new NotFoundError("Variant not found");

  const stockAvailable = variant ? variant.stock : product.stock;
  if (stockAvailable <= 0) throw new ConflictError("This product is out of stock");

  const existing = await db.cartItem.findFirst({
    where: { cartId: cart.id, productId: input.productId, variantId },
  });

  const nextQuantity = clampQuantity(
    (existing?.quantity ?? 0) + quantity,
    Math.min(MAX_QUANTITY_PER_ITEM, stockAvailable),
  );

  if (existing) {
    await db.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQuantity } });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        variantId,
        quantity: nextQuantity,
      },
    });
  }

  await db.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
}

export async function updateCartItem(
  context: CartContext,
  itemId: string,
  quantity: number,
): Promise<void> {
  const cart = await getOrCreateCart(context);
  const item = await db.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) throw new NotFoundError("Cart item not found");

  if (quantity <= 0) {
    await db.cartItem.delete({ where: { id: item.id } });
    return;
  }

  const product = await db.product.findUnique({
    where: { id: item.productId },
    include: { variants: item.variantId ? { where: { id: item.variantId } } : undefined },
  });
  if (!product) throw new NotFoundError("Product not found");

  const variant = item.variantId ? product.variants[0] : undefined;
  const stockAvailable = variant ? variant.stock : product.stock;

  const clamped = clampQuantity(
    quantity,
    Math.min(MAX_QUANTITY_PER_ITEM, Math.max(1, stockAvailable)),
  );

  await db.cartItem.update({ where: { id: item.id }, data: { quantity: clamped } });
}

export async function removeCartItem(context: CartContext, itemId: string): Promise<void> {
  const cart = await getOrCreateCart(context);
  await db.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
}

export async function clearCart(context: CartContext): Promise<void> {
  const cart = await getOrCreateCart(context);
  await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
}

export type ApplyCouponResult =
  | { valid: true; code: string; discountMinor: number }
  | { valid: false; reason: CouponInvalidReason };

export async function applyCoupon(
  context: CartContext,
  code: string,
  locale: Locale = "fr",
): Promise<ApplyCouponResult> {
  const cart = await getOrCreateCart(context);
  const current = await getCart(context, locale);

  const validation = await validateCoupon(code, current.subtotalMinor);
  if (!validation.valid) return validation;

  await db.cart.update({ where: { id: cart.id }, data: { couponCode: validation.coupon.code } });
  return { valid: true, code: validation.coupon.code, discountMinor: validation.discountMinor };
}

export async function removeCoupon(context: CartContext): Promise<void> {
  const cart = await getOrCreateCart(context);
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
}

/**
 * Moves items (and coupon) from a guest cart into the user's cart after
 * login. Guest rows are removed; duplicates merge by summing quantities.
 */
export async function mergeGuestCart(token: string, userId: string): Promise<void> {
  const guestCart = await db.cart.findUnique({
    where: { token },
    include: { items: true },
  });
  if (!guestCart || !guestCart.items.length) return;

  const userCart = await getOrCreateCart({ userId });

  for (const item of guestCart.items) {
    const existing = await db.cartItem.findFirst({
      where: { cartId: userCart.id, productId: item.productId, variantId: item.variantId },
    });
    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: clampQuantity(existing.quantity + item.quantity, MAX_QUANTITY_PER_ITEM) },
      });
      await db.cartItem.delete({ where: { id: item.id } });
    } else {
      await db.cartItem.update({ where: { id: item.id }, data: { cartId: userCart.id } });
    }
  }

  if (guestCart.couponCode && !userCart.couponCode) {
    await db.cart.update({
      where: { id: userCart.id },
      data: { couponCode: guestCart.couponCode },
    });
  }

  await db.cart.delete({ where: { id: guestCart.id } }).catch(() => undefined);
}

/** Used by checkout to read raw cart rows (products, coupon) in one call. */
export async function getCheckoutSnapshot(context: CartContext) {
  const cart = await getOrCreateCart(context);
  const rawItems = await db.cartItem.findMany({
    where: { cartId: cart.id },
    select: { productId: true, variantId: true, quantity: true },
  });

  if (!rawItems.length) {
    throw new ValidationError("Your cart is empty", [
      { path: "items", message: "Cart is empty" },
    ]);
  }

  const priced = await priceCheckoutItems(rawItems);
  return { cart, items: priced.priced, originalSubtotalMinor: priced.originalSubtotalMinor };
}
