import { z } from "zod";
import { productStatusSchema, moneyMinorSchema, idSchema, nameSchema } from "./common";

const localizedText = z.string().trim().max(500);
const slugSchema = z
  .string()
  .trim()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase latin letters, numbers and dashes only")
  .or(z.literal(""));

// ── Products ──────────────────────────────────────────────────

export const productImageSchema = z.object({
  url: z.string().trim().min(1).max(2000),
  alt: z.string().trim().max(200).nullish(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const productOptionSchema = z.object({
  attribute: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(60),
  swatch: z
    .string()
    .trim()
    .max(100)
    .regex(/^(#[0-9a-fA-F]{3,8}|[a-zA-Z0-9_.-]+)?$/, "Invalid swatch")
    .nullish(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const productVariantSchema = z.object({
  id: idSchema.optional(),
  sku: z.string().trim().min(1).max(64),
  priceMinor: moneyMinorSchema.nullish(),
  stock: z.number().int().min(0).max(99_999).default(0),
  sortOrder: z.number().int().min(0).max(999).optional(),
  options: z
    .array(
      z.object({
        attribute: z.string().trim().min(1).max(40),
        value: z.string().trim().min(1).max(60),
      }),
    )
    .min(1),
});

export const productInputSchema = z.object({
  sku: z.string().trim().min(1).max(64),
  slug: slugSchema.optional(),
  nameFr: nameSchema,
  nameAr: nameSchema,
  nameEn: nameSchema,
  descriptionFr: localizedText,
  descriptionAr: localizedText,
  descriptionEn: localizedText,
  priceMinor: moneyMinorSchema,
  compareAtPriceMinor: moneyMinorSchema.nullish(),
  stock: z.number().int().min(0).max(99_999).default(0),
  status: productStatusSchema.default("ACTIVE"),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  weightGrams: z.number().int().min(0).max(99_999).nullish(),
  categoryId: idSchema,
  subcategoryId: idSchema.nullish(),
  metaTitle: z.string().trim().max(200).nullish(),
  metaDescription: z.string().trim().max(320).nullish(),
  images: z.array(productImageSchema).max(12).default([]),
  options: z.array(productOptionSchema).max(60).default([]),
  variants: z.array(productVariantSchema).max(100).default([]),
});

export const productQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  categoryId: idSchema.optional(),
  subcategoryId: idSchema.optional(),
  status: productStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export const productBulkSchema = z.object({
  ids: z.array(idSchema).min(1).max(200),
  action: z.discriminatedUnion("type", [
    z.object({ type: z.literal("status"), status: productStatusSchema }),
    z.object({
      type: z.literal("flags"),
      featured: z.boolean().optional(),
      isNew: z.boolean().optional(),
      bestSeller: z.boolean().optional(),
    }),
  ]),
});

// ── Categories ────────────────────────────────────────────────

export const categoryInputSchema = z.object({
  nameFr: nameSchema,
  nameAr: nameSchema,
  nameEn: nameSchema,
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase latin letters, numbers and dashes only"),
  descriptionFr: z.string().trim().max(1000).nullish(),
  descriptionAr: z.string().trim().max(1000).nullish(),
  descriptionEn: z.string().trim().max(1000).nullish(),
  image: z.string().trim().max(2000).nullish(),
  icon: z.string().trim().max(60).nullish(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  metaTitle: z.string().trim().max(200).nullish(),
  metaDescription: z.string().trim().max(320).nullish(),
});

export const subcategoryInputSchema = categoryInputSchema.extend({
  categoryId: idSchema,
});

export const reorderSchema = z.object({
  ids: z.array(idSchema).min(1).max(500),
  categoryId: idSchema.optional(),
});

// ── Banners ───────────────────────────────────────────────────

export const bannerInputSchema = z.object({
  placement: z.enum(["HERO", "MIDDLE", "FOOTER"]),
  image: z.string().trim().min(1).max(2000),
  titleFr: nameSchema,
  titleAr: nameSchema,
  titleEn: nameSchema,
  descriptionFr: z.string().trim().max(500).nullish(),
  descriptionAr: z.string().trim().max(500).nullish(),
  descriptionEn: z.string().trim().max(500).nullish(),
  ctaLabelFr: z.string().trim().max(60).nullish(),
  ctaLabelAr: z.string().trim().max(60).nullish(),
  ctaLabelEn: z.string().trim().max(60).nullish(),
  ctaUrl: z.string().trim().max(500).nullish(),
  active: z.boolean().default(true),
  startsAt: z.coerce.date().nullish(),
  endsAt: z.coerce.date().nullish(),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});
