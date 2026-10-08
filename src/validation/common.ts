import { z } from "zod";
import { LOCALES, ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHODS, MAX_QUANTITY_PER_ITEM } from "@/lib/business-rules";

export const localeSchema = z.enum(LOCALES);
export const emailSchema = z.email().max(254);
export const passwordSchema = z.string().min(8).max(100);
export const nameSchema = z.string().trim().min(1).max(120);
export const phoneSchema = z
  .string()
  .trim()
  .min(6, "Phone number is too short")
  .max(30)
  .regex(/^\+?[0-9\s.-]{6,30}$/, "Enter a valid phone number");

export const moneyMinorSchema = z.number().int().min(0).max(1_000_000_00);
export const quantitySchema = z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM);
export const idSchema = z.string().trim().min(1).max(40);

export const pageSchema = z.coerce.number().int().min(1).max(10_000).default(1);
export const perPageSchema = z.coerce.number().int().min(1).max(100).default(20);

export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export const productStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

// ── Cart ──────────────────────────────────────────────────────

export const cartAddSchema = z.object({
  productId: idSchema,
  variantId: idSchema.nullish(),
  quantity: quantitySchema.default(1),
});

export const cartUpdateSchema = z.object({
  quantity: z.number().int().min(0).max(MAX_QUANTITY_PER_ITEM),
});

export const couponApplySchema = z.object({
  code: z.string().trim().min(1).max(40),
});

// ── Checkout ──────────────────────────────────────────────────

export const checkoutSchema = z.object({
  email: emailSchema.nullish(),
  fullName: nameSchema,
  phone: phoneSchema,
  city: z.string().trim().min(2).max(80),
  addressLine: z.string().trim().min(5).max(300),
  customerNote: z.string().trim().max(500).nullish(),
  paymentMethod: paymentMethodSchema,
  couponCode: z.string().trim().max(40).nullish(),
  locale: localeSchema.default("fr"),
});

// ── Reviews / newsletter ──────────────────────────────────────

export const reviewCreateSchema = z.object({
  productId: idSchema,
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).nullish(),
  comment: z.string().trim().max(2000).nullish(),
});

export const newsletterSchema = z.object({
  email: emailSchema,
  source: z.string().trim().max(40).optional(),
});
