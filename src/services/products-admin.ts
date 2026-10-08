import { db } from "@/lib/db";
import type { ProductStatus } from "@/generated/prisma/client";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { slugify, isValidSlug } from "@/lib/slug";
import { prismaErrorToAppError } from "./prisma-errors";

export interface ProductImageInput {
  id?: string;
  url: string;
  alt?: string | null;
  sortOrder?: number;
}

export interface ProductOptionInput {
  id?: string;
  attribute: string;
  value: string;
  swatch?: string | null;
  sortOrder?: number;
}

export interface ProductVariantInput {
  id?: string;
  sku: string;
  priceMinor?: number | null;
  stock: number;
  sortOrder?: number;
  options: { attribute: string; value: string }[];
}

export interface ProductInput {
  sku: string;
  slug?: string;
  nameFr: string;
  nameAr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionAr: string;
  descriptionEn: string;
  priceMinor: number;
  compareAtPriceMinor?: number | null;
  stock?: number;
  status: ProductStatus;
  featured?: boolean;
  isNew?: boolean;
  bestSeller?: boolean;
  weightGrams?: number | null;
  categoryId: string;
  subcategoryId?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  images: ProductImageInput[];
  options?: ProductOptionInput[];
  variants?: ProductVariantInput[];
}

export interface AdminProductListItem {
  id: string;
  sku: string;
  slug: string;
  name: string;
  nameAlt: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  stock: number;
  status: ProductStatus;
  featured: boolean;
  isNew: boolean;
  bestSeller: boolean;
  rating: number;
  reviewCount: number;
  salesCount: number;
  categoryName: string;
  subcategoryName: string | null;
  image: string | null;
  variantCount: number;
  updatedAt: Date;
}

export interface AdminProductFilters {
  q?: string;
  categoryId?: string;
  subcategoryId?: string;
  status?: ProductStatus;
  page?: number;
  perPage?: number;
}

export async function listProductsAdmin(filters: AdminProductFilters) {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));
  const perPage = Math.min(100, Math.max(1, Math.trunc(filters.perPage ?? 20)));

  const where: Record<string, unknown> = {};
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.subcategoryId) where.subcategoryId = filters.subcategoryId;
  if (filters.status) where.status = filters.status;
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { nameFr: { contains: q, mode: "insensitive" } },
      { nameEn: { contains: q, mode: "insensitive" } },
      { nameAr: { contains: q } },
      { sku: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        sku: true,
        slug: true,
        nameFr: true,
        nameAr: true,
        nameEn: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        status: true,
        featured: true,
        isNew: true,
        bestSeller: true,
        rating: true,
        reviewCount: true,
        salesCount: true,
        updatedAt: true,
        category: { select: { nameFr: true, nameAr: true, nameEn: true } },
        subcategory: { select: { nameFr: true, nameAr: true, nameEn: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        _count: { select: { variants: true } },
      },
    }),
  ]);

  const items: AdminProductListItem[] = products.map((product) => ({
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.nameFr,
    nameAlt: product.nameEn,
    priceMinor: product.price,
    compareAtPriceMinor: product.compareAtPrice,
    stock: product.stock,
    status: product.status,
    featured: product.featured,
    isNew: product.isNew,
    bestSeller: product.bestSeller,
    rating: product.rating,
    reviewCount: product.reviewCount,
    salesCount: product.salesCount,
    categoryName: product.category.nameFr,
    subcategoryName: product.subcategory?.nameFr ?? null,
    image: product.images[0]?.url ?? null,
    variantCount: product._count.variants,
    updatedAt: product.updatedAt,
  }));

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / perPage),
    perPage,
  };
}

export async function getProductAdmin(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      options: { orderBy: { sortOrder: "asc" } },
      variants: {
        orderBy: { sortOrder: "asc" },
        include: { options: true },
      },
      category: true,
      subcategory: true,
    },
  });
  if (!product) throw new NotFoundError("Product not found");
  return product;
}

async function ensureCategory(
  categoryId: string,
  subcategoryId: string | null | undefined,
): Promise<void> {
  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new ValidationError("Category not found", [{ path: "categoryId", message: "Unknown category" }]);

  if (subcategoryId) {
    const sub = await db.subcategory.findUnique({ where: { id: subcategoryId } });
    if (!sub || sub.categoryId !== categoryId) {
      throw new ValidationError("Subcategory does not belong to the selected category", [
        { path: "subcategoryId", message: "Invalid subcategory" },
      ]);
    }
  }
}

async function uniqueProductSlug(base: string, excludeId?: string): Promise<string> {
  const slug = slugify(base);
  if (!isValidSlug(slug)) {
    throw new ValidationError("Slug is invalid", [{ path: "slug", message: "Use latin letters, numbers and dashes" }]);
  }

  let candidate = slug;
  let suffix = 1;
  while (true) {
    const clash = await db.product.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
    suffix += 1;
    candidate = `${slug}-${suffix}`;
  }
}

async function ensureUniqueSku(sku: string, excludeId?: string): Promise<string> {
  const value = sku.trim().toUpperCase();
  const clash = await db.product.findFirst({
    where: { sku: value, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  });
  if (clash) throw new ConflictError(`SKU "${value}" is already used`);
  return value;
}

function optionKey(attribute: string, value: string): string {
  return `${attribute.trim().toLowerCase()}::${value.trim()}`;
}

function validateOptions(input: ProductInput): ProductOptionInput[] {
  const options = input.options ?? [];
  const seen = new Set<string>();
  for (const option of options) {
    const key = optionKey(option.attribute, option.value);
    if (seen.has(key)) {
      throw new ValidationError(`Duplicate option "${option.attribute}: ${option.value}"`, [
        { path: "options", message: "Duplicate option" },
      ]);
    }
    seen.add(key);
  }
  return options;
}

function validateVariants(input: ProductInput, options: ProductOptionInput[]): ProductVariantInput[] {
  const variants = input.variants ?? [];
  if (!variants.length) return [];

  const optionMap = new Map(
    options.map((option) => [optionKey(option.attribute, option.value), option]),
  );
  const skuSeen = new Set<string>();

  for (const variant of variants) {
    const sku = variant.sku.trim().toUpperCase();
    if (skuSeen.has(sku)) {
      throw new ValidationError(`Duplicate variant SKU "${sku}"`, [
        { path: "variants", message: "Duplicate SKU" },
      ]);
    }
    skuSeen.add(sku);

    if (!variant.options.length) {
      throw new ValidationError(`Variant ${sku} has no options`, [
        { path: "variants", message: "Each variant needs at least one option" },
      ]);
    }
    for (const option of variant.options) {
      if (!optionMap.has(optionKey(option.attribute, option.value))) {
        throw new ValidationError(
          `Variant ${sku} references unknown option "${option.attribute}: ${option.value}"`,
          [{ path: "variants", message: "Unknown option" }],
        );
      }
    }
  }

  return variants;
}

function recomputeStock(variants: { stock: number }[], fallback: number): number {
  if (!variants.length) return fallback;
  return variants.reduce((sum, variant) => sum + variant.stock, 0);
}

export async function createProduct(input: ProductInput): Promise<{ id: string; slug: string }> {
  await ensureCategory(input.categoryId, input.subcategoryId);
  const sku = await ensureUniqueSku(input.sku);
  const slug = await uniqueProductSlug(input.slug || input.nameEn || input.nameFr);
  const options = validateOptions(input);
  const variants = validateVariants(input, options);

  try {
    const id = await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku,
          slug,
          nameFr: input.nameFr.trim(),
          nameAr: input.nameAr.trim(),
          nameEn: input.nameEn.trim(),
          descriptionFr: input.descriptionFr,
          descriptionAr: input.descriptionAr,
          descriptionEn: input.descriptionEn,
          price: input.priceMinor,
          compareAtPrice: input.compareAtPriceMinor ?? null,
          stock: variants.length ? 0 : Math.max(0, input.stock ?? 0),
          status: input.status,
          featured: input.featured ?? false,
          isNew: input.isNew ?? false,
          bestSeller: input.bestSeller ?? false,
          weightGrams: input.weightGrams ?? null,
          categoryId: input.categoryId,
          subcategoryId: input.subcategoryId ?? null,
          metaTitle: input.metaTitle ?? null,
          metaDescription: input.metaDescription ?? null,
        },
      });

      if (input.images.length) {
        await tx.productImage.createMany({
          data: input.images.map((image, index) => ({
            productId: product.id,
            url: image.url,
            alt: image.alt ?? null,
            sortOrder: image.sortOrder ?? index,
          })),
        });
      }

      const optionIdByKey = new Map<string, string>();
      for (const [index, option] of options.entries()) {
        const created = await tx.variantOption.create({
          data: {
            productId: product.id,
            attribute: option.attribute.trim(),
            value: option.value.trim(),
            swatch: option.swatch ?? null,
            sortOrder: option.sortOrder ?? index,
          },
        });
        optionIdByKey.set(optionKey(option.attribute, option.value), created.id);
      }

      for (const [index, variant] of variants.entries()) {
        await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: variant.sku.trim().toUpperCase(),
            price: variant.priceMinor ?? null,
            stock: Math.max(0, variant.stock),
            sortOrder: variant.sortOrder ?? index,
            options: {
              connect: variant.options.map((option) => ({
                id: optionIdByKey.get(optionKey(option.attribute, option.value))!,
              })),
            },
          },
        });
      }

      if (variants.length) {
        const totalStock = variants.reduce((sum, variant) => sum + Math.max(0, variant.stock), 0);
        await tx.product.update({ where: { id: product.id }, data: { stock: totalStock } });
      }

      return product.id;
    });

    return { id, slug };
  } catch (error) {
    throw prismaErrorToAppError(error);
  }
}

export async function updateProduct(id: string, input: ProductInput): Promise<{ id: string; slug: string }> {
  const existing = await db.product.findUnique({
    where: { id },
    select: { id: true, slug: true, stock: true },
  });
  if (!existing) throw new NotFoundError("Product not found");

  await ensureCategory(input.categoryId, input.subcategoryId);
  const sku = await ensureUniqueSku(input.sku, id);
  const slug = await uniqueProductSlug(input.slug || input.nameEn || input.nameFr, id);
  const options = validateOptions(input);
  const variants = validateVariants(input, options);

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          sku,
          slug,
          nameFr: input.nameFr.trim(),
          nameAr: input.nameAr.trim(),
          nameEn: input.nameEn.trim(),
          descriptionFr: input.descriptionFr,
          descriptionAr: input.descriptionAr,
          descriptionEn: input.descriptionEn,
          price: input.priceMinor,
          compareAtPrice: input.compareAtPriceMinor ?? null,
          status: input.status,
          featured: input.featured ?? false,
          isNew: input.isNew ?? false,
          bestSeller: input.bestSeller ?? false,
          weightGrams: input.weightGrams ?? null,
          categoryId: input.categoryId,
          subcategoryId: input.subcategoryId ?? null,
          metaTitle: input.metaTitle ?? null,
          metaDescription: input.metaDescription ?? null,
        },
      });

      // Images: replace wholesale (cheap, no external references).
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (input.images.length) {
        await tx.productImage.createMany({
          data: input.images.map((image, index) => ({
            productId: id,
            url: image.url,
            alt: image.alt ?? null,
            sortOrder: image.sortOrder ?? index,
          })),
        });
      }

      // Options: diff by (attribute, value).
      const currentOptions = await tx.variantOption.findMany({ where: { productId: id } });
      const currentByKey = new Map(
        currentOptions.map((option) => [optionKey(option.attribute, option.value), option]),
      );
      const inputKeys = new Set(options.map((option) => optionKey(option.attribute, option.value)));

      const optionIdByKey = new Map<string, string>();
      for (const [index, option] of options.entries()) {
        const key = optionKey(option.attribute, option.value);
        const current = currentByKey.get(key);
        if (current) {
          await tx.variantOption.update({
            where: { id: current.id },
            data: {
              swatch: option.swatch ?? null,
              sortOrder: option.sortOrder ?? index,
            },
          });
          optionIdByKey.set(key, current.id);
        } else {
          const created = await tx.variantOption.create({
            data: {
              productId: id,
              attribute: option.attribute.trim(),
              value: option.value.trim(),
              swatch: option.swatch ?? null,
              sortOrder: option.sortOrder ?? index,
            },
          });
          optionIdByKey.set(key, created.id);
        }
      }

      for (const current of currentOptions) {
        const key = optionKey(current.attribute, current.value);
        if (!inputKeys.has(key)) {
          await tx.variantOption.delete({ where: { id: current.id } });
        }
      }

      // Variants: diff by id.
      const currentVariants = await tx.productVariant.findMany({
        where: { productId: id },
        select: { id: true },
      });
      const currentVariantIds = new Set(currentVariants.map((variant) => variant.id));
      const keptVariantIds = new Set<string>();

      for (const [index, variant] of variants.entries()) {
        const optionIds = variant.options.map(
          (option) => optionIdByKey.get(optionKey(option.attribute, option.value))!,
        );
        const data = {
          sku: variant.sku.trim().toUpperCase(),
          price: variant.priceMinor ?? null,
          stock: Math.max(0, variant.stock),
          sortOrder: variant.sortOrder ?? index,
          options: { set: [], connect: optionIds.map((optionId) => ({ id: optionId })) },
        };

        if (variant.id && currentVariantIds.has(variant.id)) {
          await tx.productVariant.update({ where: { id: variant.id }, data });
          keptVariantIds.add(variant.id);
        } else {
          const created = await tx.productVariant.create({
            data: { ...data, productId: id },
          });
          keptVariantIds.add(created.id);
        }
      }

      for (const variantId of currentVariantIds) {
        if (!keptVariantIds.has(variantId)) {
          await tx.productVariant.delete({ where: { id: variantId } });
        }
      }

      const remaining = variants.length ? variants : [];
      const stockTotal = recomputeStock(
        remaining.map((variant) => ({ stock: Math.max(0, variant.stock) })),
        Math.max(0, input.stock ?? existing.stock),
      );
      await tx.product.update({ where: { id }, data: { stock: stockTotal } });
    });

    return { id, slug };
  } catch (error) {
    throw prismaErrorToAppError(error);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const product = await db.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) throw new NotFoundError("Product not found");
  await db.product.delete({ where: { id } });
}

export async function bulkSetProductStatus(
  ids: string[],
  status: ProductStatus,
): Promise<number> {
  const result = await db.product.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });
  return result.count;
}

export async function bulkSetProductFlags(
  ids: string[],
  flags: { featured?: boolean; isNew?: boolean; bestSeller?: boolean },
): Promise<number> {
  const data: Record<string, boolean> = {};
  if (flags.featured !== undefined) data.featured = flags.featured;
  if (flags.isNew !== undefined) data.isNew = flags.isNew;
  if (flags.bestSeller !== undefined) data.bestSeller = flags.bestSeller;
  if (!Object.keys(data).length) return 0;

  const result = await db.product.updateMany({ where: { id: { in: ids } }, data });
  return result.count;
}

/** Absolute stock adjustment from the admin stock editor. */
export async function setProductStock(id: string, stock: number): Promise<void> {
  const product = await db.product.findUnique({
    where: { id },
    select: { id: true, _count: { select: { variants: true } } },
  });
  if (!product) throw new NotFoundError("Product not found");

  if (product._count.variants > 0) {
    throw new ConflictError("This product uses variants — adjust stock on each variant instead");
  }

  await db.product.update({ where: { id }, data: { stock: Math.max(0, stock) } });
}
