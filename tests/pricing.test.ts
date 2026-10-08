import { describe, expect, it } from "vitest";
import { computeCouponDiscount, computeTotals, resolveSalePrice } from "@/services/pricing";

describe("computeCouponDiscount", () => {
  it("takes 10% off a percent coupon (regression: discount was the price after)", () => {
    expect(computeCouponDiscount({ type: "PERCENT", value: 10 }, 79900)).toBe(7990);
  });

  it("applies larger and edge percentages", () => {
    expect(computeCouponDiscount({ type: "PERCENT", value: 25 }, 10000)).toBe(2500);
    expect(computeCouponDiscount({ type: "PERCENT", value: 100 }, 50000)).toBe(50000);
    expect(computeCouponDiscount({ type: "PERCENT", value: 0 }, 50000)).toBe(0);
  });

  it("subtracts a fixed amount without exceeding the subtotal", () => {
    expect(computeCouponDiscount({ type: "FIXED", value: 5000 }, 50000)).toBe(5000);
    expect(computeCouponDiscount({ type: "FIXED", value: 80000 }, 50000)).toBe(50000);
  });

  it("returns 0 for empty carts", () => {
    expect(computeCouponDiscount({ type: "PERCENT", value: 10 }, 0)).toBe(0);
    expect(computeCouponDiscount({ type: "FIXED", value: 5000 }, -100)).toBe(0);
  });
});

describe("computeTotals", () => {
  it("sums lines, applies the coupon and keeps free shipping above the threshold", () => {
    const totals = computeTotals({
      items: [{ unitPriceMinor: 79900, quantity: 1 }],
      coupon: { type: "PERCENT", value: 10 },
      zoneFeeMinor: 2000,
      freeShippingThresholdMinor: 50000,
    });

    expect(totals.subtotalMinor).toBe(79900);
    expect(totals.couponDiscountMinor).toBe(7990);
    expect(totals.deliveryFeeMinor).toBe(0);
    expect(totals.freeShippingApplied).toBe(true);
    expect(totals.totalMinor).toBe(71910);
  });

  it("charges the zone fee below the threshold", () => {
    const totals = computeTotals({
      items: [{ unitPriceMinor: 24900, quantity: 1 }],
      zoneFeeMinor: 2000,
      freeShippingThresholdMinor: 50000,
    });

    expect(totals.deliveryFeeMinor).toBe(2000);
    expect(totals.freeShippingApplied).toBe(false);
    expect(totals.totalMinor).toBe(26900);
  });

  it("never returns a negative total", () => {
    const totals = computeTotals({
      items: [{ unitPriceMinor: 3000, quantity: 1 }],
      coupon: { type: "FIXED", value: 90000 },
      zoneFeeMinor: 0,
      freeShippingThresholdMinor: 50000,
    });

    expect(totals.totalMinor).toBe(0);
  });

  it("sums multiple lines", () => {
    const totals = computeTotals({
      items: [
        { unitPriceMinor: 79900, quantity: 2 },
        { unitPriceMinor: 24900, quantity: 1 },
      ],
      zoneFeeMinor: 0,
      freeShippingThresholdMinor: 50000,
    });

    expect(totals.subtotalMinor).toBe(184700);
    expect(totals.totalMinor).toBe(184700);
  });
});

describe("resolveSalePrice", () => {
  it("applies the promotion percent to the base price", () => {
    expect(resolveSalePrice(10000, null, 20).priceMinor).toBe(8000);
    expect(resolveSalePrice(10000, null, 0).priceMinor).toBe(10000);
    expect(resolveSalePrice(10000, null, 20).onSale).toBe(true);
  });

  it("flags a compare-at price as a sale", () => {
    const sale = resolveSalePrice(8000, 10000);
    expect(sale.priceMinor).toBe(8000);
    expect(sale.onSale).toBe(true);
    expect(sale.discountPercentValue).toBe(20);
  });
});
