/**
 * Money helpers. ARAS stores every amount as an integer number of centimes
 * (1 DH = 100 centimes) so arithmetic is exact and serializable.
 */

export const CURRENCY = "MAD";
export const CURRENCY_SYMBOL = "DH";

export function toMinor(major: number): number {
  return Math.round(major * 100);
}

export function toMajor(minor: number): number {
  return Math.round(minor) / 100;
}

/** Parses admin/customer input ("1 299,50", "199.50", "199") into centimes. */
export function parseAmountToMinor(input: string): number {
  const normalized = input
    .replace(/[^\d.,-]/g, "")
    .replace(/\s/g, "")
    .replace(",", ".");
  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value) || value < 0) {
    throw new Error(`Invalid amount: ${input}`);
  }
  return toMinor(value);
}

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** "1,299 DH" / "199,50 DH" — always western digits, brand-consistent. */
export function formatMAD(minor: number): string {
  const hasCents = Math.abs(minor) % 100 !== 0;
  const value = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(toMajor(minor));
  return `${value} ${CURRENCY_SYMBOL}`;
}

/** Number only, no currency suffix (for inputs/tables). */
export function formatAmount(minor: number): string {
  return numberFormatter.format(toMajor(minor));
}

/** Discount percentage between a compare-at price and the current price. */
export function discountPercent(price: number, compareAtPrice?: number | null): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/** Applies a percentage discount, rounding to the nearest centime. */
export function applyPercentOff(minor: number, percent: number): number {
  if (percent <= 0) return minor;
  if (percent >= 100) return 0;
  return Math.round(minor * (1 - percent / 100));
}

export function clampQuantity(quantity: number, max = 99): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(Math.max(Math.trunc(quantity), 1), max);
}
