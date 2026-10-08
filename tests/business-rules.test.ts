import { describe, expect, it } from "vitest";
import {
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  canTransition,
  isFreeShipping,
} from "@/lib/business-rules";
import { cartAddSchema, checkoutSchema, couponApplySchema, newsletterSchema } from "@/validation/common";

describe("order status transitions", () => {
  it("allows the happy path", () => {
    expect(canTransition("NEW", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "PREPARING")).toBe(true);
    expect(canTransition("PREPARING", "SHIPPED")).toBe(true);
    expect(canTransition("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("allows cancelling early statuses", () => {
    expect(canTransition("NEW", "CANCELLED")).toBe(true);
    expect(canTransition("CONFIRMED", "CANCELLED")).toBe(true);
  });

  it("forwards and terminal statuses", () => {
    expect(canTransition("NEW", "SHIPPED")).toBe(false);
    expect(canTransition("DELIVERED", "CANCELLED")).toBe(false);
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
    expect(canTransition("DELIVERED", "NEW")).toBe(false);
  });

  it("declares a target list for every status", () => {
    for (const status of ORDER_STATUSES) {
      expect(Array.isArray(ORDER_STATUS_TRANSITIONS[status])).toBe(true);
    }
    expect(ORDER_STATUS_TRANSITIONS.DELIVERED).toHaveLength(0);
    expect(ORDER_STATUS_TRANSITIONS.CANCELLED).toHaveLength(0);
  });

  it("covers every payment status", () => {
    expect(PAYMENT_STATUSES).toContain("PENDING");
    expect(PAYMENT_STATUSES).toContain("REFUNDED");
  });
});

describe("isFreeShipping", () => {
  it("is exact at the threshold", () => {
    expect(isFreeShipping(50000, 50000)).toBe(true);
    expect(isFreeShipping(49999, 50000)).toBe(false);
  });

  it("is disabled when the threshold is zero", () => {
    expect(isFreeShipping(999999, 0)).toBe(false);
  });
});

describe("validation schemas", () => {
  it("accepts a valid cart addition", () => {
    const parsed = cartAddSchema.parse({ productId: "p1", variantId: null, quantity: 2 });
    expect(parsed.quantity).toBe(2);
  });

  it("rejects quantities above the cap", () => {
    expect(() => cartAddSchema.parse({ productId: "p1", quantity: 1000 })).toThrow();
    expect(() => cartAddSchema.parse({ productId: "p1", quantity: 0 })).toThrow();
  });

  it("requires the checkout contact and address", () => {
    const result = checkoutSchema.safeParse({
      fullName: "Test Client",
      phone: "0612345678",
      city: "Casablanca",
      addressLine: "12 Rue de la Paix",
      paymentMethod: "COD",
      locale: "fr",
      items: [],
    });
    expect(result.success).toBe(true);

    expect(checkoutSchema.safeParse({ locale: "fr" }).success).toBe(false);
  });

  it("rejects an unknown payment method", () => {
    expect(
      checkoutSchema.safeParse({
        fullName: "Test Client",
        phone: "0612345678",
        city: "Casablanca",
        addressLine: "12 Rue de la Paix",
        paymentMethod: "BITCOIN",
        locale: "fr",
      }).success,
    ).toBe(false);
  });

  it("validates coupon codes and emails", () => {
    expect(couponApplySchema.parse({ code: "BIENVENUE10" }).code).toBe("BIENVENUE10");
    expect(newsletterSchema.safeParse({ email: "client@aras.ma" }).success).toBe(true);
    expect(newsletterSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});
