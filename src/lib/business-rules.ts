/**
 * Central definition of ARAS business rules and defaults.
 * Nothing else in the codebase may hard-code these values.
 */

export const LOCALES = ["fr", "ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export const CURRENCY = "MAD";
export const COUNTRY = "MA";

export const ORDER_STATUSES = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Allowed transitions of the order status state machine. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["COD", "CARD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Applied when StoreSetting.freeShippingThreshold has not been configured. */
export const DEFAULT_FREE_SHIPPING_THRESHOLD = toMinorSafe(500);

function toMinorSafe(major: number): number {
  return Math.round(major * 100);
}

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_QUANTITY_PER_ITEM = 99;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
] as const;

export function isFreeShipping(
  subtotalMinor: number,
  thresholdMinor: number,
): boolean {
  return subtotalMinor >= thresholdMinor && thresholdMinor > 0;
}
