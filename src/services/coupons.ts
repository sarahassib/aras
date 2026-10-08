import { db } from "@/lib/db";
import type { DiscountType, Prisma } from "@/generated/prisma/client";
import { ConflictError } from "@/lib/errors";
import { computeCouponDiscount } from "./pricing";

export type CouponInvalidReason =
  | "NOT_FOUND"
  | "INACTIVE"
  | "NOT_STARTED"
  | "EXPIRED"
  | "MIN_ORDER"
  | "EXHAUSTED";

export interface CouponDTO {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minOrderAmountMinor: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  active: boolean;
}

export type CouponValidation =
  | { valid: true; coupon: CouponDTO; discountMinor: number }
  | { valid: false; reason: CouponInvalidReason };

function toDTO(coupon: {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  active: boolean;
}): CouponDTO {
  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrderAmountMinor: coupon.minOrderAmount,
    maxUses: coupon.maxUses,
    usedCount: coupon.usedCount,
    startsAt: coupon.startsAt,
    expiresAt: coupon.expiresAt,
    active: coupon.active,
  };
}

/** Validates a coupon against the current subtotal (never throws). */
export async function validateCoupon(
  rawCode: string,
  subtotalMinor: number,
): Promise<CouponValidation> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, reason: "NOT_FOUND" };

  const coupon = await db.coupon.findUnique({ where: { code } });
  if (!coupon) return { valid: false, reason: "NOT_FOUND" };
  if (!coupon.active) return { valid: false, reason: "INACTIVE" };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return { valid: false, reason: "NOT_STARTED" };
  if (coupon.expiresAt && coupon.expiresAt < now) return { valid: false, reason: "EXPIRED" };
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, reason: "EXHAUSTED" };
  }
  if (coupon.minOrderAmount !== null && subtotalMinor < coupon.minOrderAmount) {
    return { valid: false, reason: "MIN_ORDER" };
  }

  const dto = toDTO(coupon);
  return {
    valid: true,
    coupon: dto,
    discountMinor: computeCouponDiscount(
      { type: coupon.type, value: coupon.value },
      subtotalMinor,
    ),
  };
}

/** Increments usage inside an existing transaction. */
export async function incrementCouponUsage(
  tx: Prisma.TransactionClient,
  couponId: string,
): Promise<void> {
  await tx.coupon.update({
    where: { id: couponId },
    data: { usedCount: { increment: 1 } },
  });
}

// ── Admin CRUD ────────────────────────────────────────────────

export interface CouponInput {
  code: string;
  type: DiscountType;
  value: number;
  minOrderAmountMinor?: number | null;
  maxUses?: number | null;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  active?: boolean;
}

export async function listCoupons() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return coupons.map(toDTO);
}

export async function createCoupon(input: CouponInput) {
  const code = input.code.trim().toUpperCase();
  const existing = await db.coupon.findUnique({ where: { code } });
  if (existing) throw new ConflictError(`Coupon "${code}" already exists`);

  const coupon = await db.coupon.create({
    data: {
      code,
      type: input.type,
      value: input.value,
      minOrderAmount: input.minOrderAmountMinor ?? null,
      maxUses: input.maxUses ?? null,
      startsAt: input.startsAt ?? null,
      expiresAt: input.expiresAt ?? null,
      active: input.active ?? true,
    },
  });
  return toDTO(coupon);
}

export async function updateCoupon(id: string, input: Partial<CouponInput>) {
  const coupon = await db.coupon.update({
    where: { id },
    data: {
      ...(input.code !== undefined ? { code: input.code.trim().toUpperCase() } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.value !== undefined ? { value: input.value } : {}),
      ...(input.minOrderAmountMinor !== undefined
        ? { minOrderAmount: input.minOrderAmountMinor }
        : {}),
      ...(input.maxUses !== undefined ? { maxUses: input.maxUses } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
  return toDTO(coupon);
}

export async function deleteCoupon(id: string): Promise<void> {
  try {
    await db.coupon.delete({ where: { id } });
  } catch (error) {
    if ((error as { code?: string }).code === "P2003") {
      throw new ConflictError(
        "This coupon is used by existing orders — deactivate it instead of deleting.",
      );
    }
    throw error;
  }
}
