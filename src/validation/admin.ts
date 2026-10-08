import { z } from "zod";
import { moneyMinorSchema, idSchema, nameSchema, emailSchema } from "./common";

// ── Coupons ───────────────────────────────────────────────────

export const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, dashes and underscores only"),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.number().int().min(1),
    minOrderAmountMinor: moneyMinorSchema.nullish(),
    maxUses: z.number().int().min(1).max(1_000_000).nullish(),
    startsAt: z.coerce.date().nullish(),
    expiresAt: z.coerce.date().nullish(),
    active: z.boolean().default(true),
  })
  .refine(
    (coupon) => coupon.type !== "PERCENT" || coupon.value <= 100,
    { path: ["value"], message: "Percentage cannot exceed 100" },
  );

// ── Promotions ────────────────────────────────────────────────

export const promotionInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(["PRODUCT", "CATEGORY"]),
  targetId: idSchema,
  percent: z.number().int().min(1).max(99),
  startsAt: z.coerce.date().nullish(),
  endsAt: z.coerce.date().nullish(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

// ── Delivery zones ────────────────────────────────────────────

export const deliveryZoneInputSchema = z.object({
  city: z.string().trim().min(2).max(80),
  feeMinor: moneyMinorSchema,
  active: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

// ── Store settings ────────────────────────────────────────────

export const settingsInputSchema = z.object({
  storeName: z.string().trim().min(1).max(120).optional(),
  logoUrl: z.string().trim().max(2000).nullish(),
  contactEmail: emailSchema.nullish().or(z.literal("")),
  phone: z.string().trim().max(40).nullish(),
  whatsapp: z.string().trim().max(40).nullish(),
  address: z.string().trim().max(300).nullish(),
  currency: z.string().trim().min(3).max(8).optional(),
  freeShippingThresholdMinor: moneyMinorSchema.optional(),
  codEnabled: z.boolean().optional(),
  cardEnabled: z.boolean().optional(),
  paymentInstructionsFr: z.string().trim().max(1000).nullish(),
  paymentInstructionsAr: z.string().trim().max(1000).nullish(),
  paymentInstructionsEn: z.string().trim().max(1000).nullish(),
  metaTitle: z.string().trim().max(200).nullish(),
  metaDescription: z.string().trim().max(320).nullish(),
  facebookUrl: z.string().trim().max(300).nullish(),
  instagramUrl: z.string().trim().max(300).nullish(),
  tiktokUrl: z.string().trim().max(300).nullish(),
  youtubeUrl: z.string().trim().max(300).nullish(),
  announcementFr: z.string().trim().max(200).nullish(),
  announcementAr: z.string().trim().max(200).nullish(),
  announcementEn: z.string().trim().max(200).nullish(),
});

// ── Order admin ───────────────────────────────────────────────

export const orderQuerySchema = z.object({
  status: z.enum(["NEW", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"]).optional(),
  q: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const orderStatusChangeSchema = z.object({
  status: z.enum(["NEW", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  note: z.string().trim().max(500).nullish(),
});

export const orderNotesSchema = z.object({
  adminNotes: z.string().trim().max(3000).nullish(),
});
