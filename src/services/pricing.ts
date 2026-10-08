import { applyPercentOff, discountPercent } from "@/lib/money";
import { isFreeShipping } from "@/lib/business-rules";

export interface PricedItemInput {
  unitPriceMinor: number;
  quantity: number;
}

export interface CouponInput {
  type: "PERCENT" | "FIXED";
  value: number;
}

export interface CartTotals {
  subtotalMinor: number;
  discountMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
  freeShippingApplied: boolean;
  couponDiscountMinor: number;
  itemDiscountMinor: number;
}

export interface ComputeTotalsInput {
  items: PricedItemInput[];
  /** Discount already removed from unit prices (promotions / sale prices). */
  originalSubtotalMinor?: number;
  coupon?: CouponInput | null;
  /** Raw zone delivery fee before the free-shipping rule. */
  zoneFeeMinor: number;
  freeShippingThresholdMinor: number;
}

/** Coupon discount, never exceeding the order subtotal. */
export function computeCouponDiscount(
  coupon: CouponInput,
  subtotalMinor: number,
): number {
  if (subtotalMinor <= 0) return 0;

  const raw =
    coupon.type === "PERCENT"
      ? applyPercentOff(subtotalMinor, coupon.value)
      : Math.min(coupon.value, subtotalMinor);

  return Math.max(0, Math.min(raw, subtotalMinor));
}

/** Central total calculation — used by cart, checkout, orders and tests. */
export function computeTotals(input: ComputeTotalsInput): CartTotals {
  const subtotalMinor = input.items.reduce(
    (sum, item) => sum + item.unitPriceMinor * item.quantity,
    0,
  );

  const originalSubtotal = input.originalSubtotalMinor ?? subtotalMinor;
  const itemDiscountMinor = Math.max(0, originalSubtotal - subtotalMinor);

  const couponDiscountMinor = input.coupon
    ? computeCouponDiscount(input.coupon, subtotalMinor)
    : 0;

  const afterCoupon = subtotalMinor - couponDiscountMinor;

  const freeShippingApplied =
    isFreeShipping(afterCoupon, input.freeShippingThresholdMinor) ||
    (input.zoneFeeMinor === 0 && input.freeShippingThresholdMinor > 0);

  const deliveryFeeMinor = freeShippingApplied ? 0 : input.zoneFeeMinor;

  const totalMinor = Math.max(0, afterCoupon + deliveryFeeMinor);

  return {
    subtotalMinor,
    discountMinor: couponDiscountMinor + itemDiscountMinor,
    deliveryFeeMinor,
    totalMinor,
    freeShippingApplied: freeShippingApplied && input.zoneFeeMinor > 0,
    couponDiscountMinor,
    itemDiscountMinor,
  };
}

export interface SalePrice {
  priceMinor: number;
  compareAtMinor: number | null;
  onSale: boolean;
  discountPercentValue: number;
}

/** Resolves the effective price of a product under an optional promotion. */
export function resolveSalePrice(
  price: number,
  compareAtPrice: number | null,
  promotionPercent?: number | null,
): SalePrice {
  const compareAt = compareAtPrice ?? null;

  if (promotionPercent && promotionPercent > 0) {
    const promoPrice = applyPercentOff(price, Math.min(promotionPercent, 100));
    const baseCompareAt = compareAt && compareAt > price ? compareAt : price;
    return {
      priceMinor: promoPrice,
      compareAtMinor: baseCompareAt,
      onSale: promoPrice < baseCompareAt,
      discountPercentValue: discountPercent(promoPrice, baseCompareAt),
    };
  }

  return {
    priceMinor: price,
    compareAtMinor: compareAt,
    onSale: compareAt !== null && compareAt > price,
    discountPercentValue: discountPercent(price, compareAt),
  };
}
