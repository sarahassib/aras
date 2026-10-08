import { db } from "@/lib/db";
import type { Locale } from "@/lib/business-rules";
import type { ProductStatus } from "@/generated/prisma/client";
import { localizedName, localizedDescription } from "@/lib/localized";
import { resolveSalePrice } from "./pricing";
import { getCategoryBySlug, getSubcategoryBySlug } from "./categories";

// ── Promotions ────────────────────────────────────────────────

export interface PromotionMap {
  byProduct: Map<string, number>;
  byCategory: Map<string, number>;
}

/** Active promotions (product-level and category-level) as percent maps. */
export async function loadPromotionMap(): Promise<PromotionMap> {
  const now = new Date();
  const promotions = await db.promotion.findMany({
    where: {
      active: true,
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
  });

  const byProduct = new Map<string, number>();
  const byCategory = new Map<string, number>();

  for (const promo of promotions) {
    const target =
      promo.type === "PRODUCT" ? byProduct : byCategory;
    const existing = target.get(promo.targetId) ?? 0;
    if (promo.percent > existing) target.set(promo.targetId, promo.percent);
  }

  return { byProduct, byCategory };
}

export function promotionPercentFor(
  product: { id: string; categoryId: string; subcategoryCategoryId?: string | null },
  map: PromotionMap,
): number | null {
  return (
    map.byProduct.get(product.id) ??
    map.byCategory.get(product.categoryId) ??
    (product.subcategoryCategoryId
      ? map.byCategory.get(product.subcategoryCategoryId) ?? null
      : null) ??
    null
  );
}

// ── DTOs ──────────────────────────────────────────────────────

export interface ProductOptionDTO {
  id: string;
  attribute: string;
  value: string;
  swatch: string | null;
  sortOrder: number;
}

export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  priceMinor: number;
  compareAtMinor: number | null;
  discountPercent: number;
  onSale: boolean;
  image: string | null;
  rating: number;
  reviewCount: number;
  stock: number;
  inStock: boolean;
  isNew: boolean;
  featured: boolean;
  bestSeller: boolean;
  categorySlug: string;
  subcategorySlug: string | null;
  sizes: string[];
  colors: { value: string; swatch: string | null }[];
}

export interface ProductVariantDTO {
  id: string;
  sku: string;
  label: string;
  priceMinor: number;
  stock: number;
  inStock: boolean;
  options: { attribute: string; value: string; swatch: string | null }[];
}

export interface ProductDetail extends ProductListItem {
  sku: string;
  description: string;
  weightGrams: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  images: { url: string; alt: string | null }[];
  category: { id: string; slug: string; name: string };
  subcategory: { id: string; slug: string; name: string } | null;
  options: ProductOptionDTO[];
  variants: ProductVariantDTO[];
  hasVariants: boolean;
  related: ProductListItem[];
}

export interface ProductFacets {
  sizes: { value: string; count: number }[];
  colors: { value: string; swatch: string | null; count: number }[];
  priceMinMinor: number | null;
  priceMaxMinor: number | null;
}

export type ProductSortKey =
  | "newest"
  | "popular"
  | "rating"
  | "price_asc"
  | "price_desc";

export interface ProductFilters {
  categorySlug?: string;
  subcategorySlug?: string;
  q?: string;
  minPriceMinor?: number;
  maxPriceMinor?: number;
  onSale?: boolean;
  inStock?: boolean;
  sizes?: string[];
  colors?: string[];
  featured?: boolean;
  isNew?: boolean;
  bestSeller?: boolean;
  sort?: ProductSortKey;
  page?: number;
  perPage?: number;
  /** Admin-only status override; defaults to ACTIVE for the storefront. */
  status?: ProductStatus;
}

export interface ProductListResult {
  items: ProductListItem[];
  total: number;
  page: number;
  pages: number;
  perPage: number;
  facets: ProductFacets;
}

// ── Query building ────────────────────────────────────────────

type PrismaWhere = Record<string, unknown>;

async function buildWhere(
  filters: ProductFilters,
): Promise<{ where: PrismaWhere; invalid: boolean }> {
  const where: PrismaWhere = { status: filters.status ?? "ACTIVE" };

  if (filters.categorySlug || filters.subcategorySlug) {
    if (filters.subcategorySlug) {
      const sub = await getSubcategoryBySlug(filters.subcategorySlug, "fr");
      if (!sub) return { where, invalid: true };
      if (filters.categorySlug && sub.category.slug !== filters.categorySlug) {
        return { where, invalid: true };
      }
      where.subcategoryId = sub.id;
    } else if (filters.categorySlug) {
      const category = await getCategoryBySlug(filters.categorySlug, "fr");
      if (!category) return { where, invalid: true };
      where.categoryId = category.id;
    }
  }

  if (filters.featured) where.featured = true;
  if (filters.isNew) where.isNew = true;
  if (filters.bestSeller) where.bestSeller = true;

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { nameFr: { contains: q, mode: "insensitive" } },
      { nameAr: { contains: q } },
      { nameEn: { contains: q, mode: "insensitive" } },
      { descriptionFr: { contains: q, mode: "insensitive" } },
      { descriptionEn: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  // Price filtering runs on the base price (promotion discounts are applied
  // to the displayed price after the query).
  if (filters.minPriceMinor !== undefined || filters.maxPriceMinor !== undefined) {
    where.price = {
      ...(filters.minPriceMinor !== undefined ? { gte: filters.minPriceMinor } : {}),
      ...(filters.maxPriceMinor !== undefined ? { lte: filters.maxPriceMinor } : {}),
    };
  }

  return { where, invalid: false };
}

function optionPairs(product: {
  id: string;
  options: { attribute: string; value: string; swatch: string | null }[];
}): { sizes: string[]; colors: { value: string; swatch: string | null }[] } {
  const sizes: string[] = [];
  const colors: { value: string; swatch: string | null }[] = [];
  const seenColor = new Set<string>();

  for (const option of product.options) {
    if (option.attribute === "Size" && !sizes.includes(option.value)) {
      sizes.push(option.value);
    } else if (option.attribute === "Color" && !seenColor.has(option.value)) {
      seenColor.add(option.value);
      colors.push({ value: option.value, swatch: option.swatch });
    }
  }

  return { sizes, colors };
}

function toItemDTO(
  product: {
    id: string;
    slug: string;
    nameFr: string;
    nameAr: string;
    nameEn: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
    isNew: boolean;
    featured: boolean;
    bestSeller: boolean;
    rating: number;
    reviewCount: number;
    category: { slug: string };
    subcategory: { slug: string } | null;
    images: { url: string; sortOrder: number }[];
    options: { attribute: string; value: string; swatch: string | null }[];
  },
  locale: Locale,
  promoPercent: number | null,
): ProductListItem {
  const sale = resolveSalePrice(product.price, product.compareAtPrice, promoPercent);
  const { sizes, colors } = optionPairs(product);
  const firstImage = product.images[0]?.url ?? null;

  return {
    id: product.id,
    slug: product.slug,
    name: localizedName(product, locale),
    priceMinor: sale.priceMinor,
    compareAtMinor: sale.compareAtMinor,
    discountPercent: sale.discountPercentValue,
    onSale: sale.onSale,
    image: firstImage,
    rating: Math.round(product.rating * 10) / 10,
    reviewCount: product.reviewCount,
    stock: product.stock,
    inStock: product.stock > 0,
    isNew: product.isNew,
    featured: product.featured,
    bestSeller: product.bestSeller,
    categorySlug: product.category.slug,
    subcategorySlug: product.subcategory?.slug ?? null,
    sizes,
    colors,
  };
}

const PRODUCT_SELECT = {
  id: true,
  slug: true,
  sku: true,
  nameFr: true,
  nameAr: true,
  nameEn: true,
  descriptionFr: true,
  descriptionAr: true,
  descriptionEn: true,
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
  weightGrams: true,
  categoryId: true,
  subcategoryId: true,
  metaTitle: true,
  metaDescription: true,
  createdAt: true,
  category: { select: { id: true, slug: true, nameFr: true, nameAr: true, nameEn: true } },
  subcategory: {
    select: { id: true, slug: true, nameFr: true, nameAr: true, nameEn: true, categoryId: true },
  },
  images: { orderBy: { sortOrder: "asc" as const }, select: { url: true, alt: true, sortOrder: true } },
  options: { orderBy: { sortOrder: "asc" as const }, select: { id: true, attribute: true, value: true, swatch: true, sortOrder: true } },
} as const;

const SORT_ORDER: Record<ProductSortKey, Record<string, "asc" | "desc">> = {
  newest: { createdAt: "desc" },
  popular: { salesCount: "desc" },
  rating: { rating: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
};

// ── Public queries ────────────────────────────────────────────

export async function listProducts(
  filters: ProductFilters,
  locale: Locale = "fr",
): Promise<ProductListResult> {
  const promotions = await loadPromotionMap();
  const { where, invalid } = await buildWhere(filters);

  const page = Math.max(1, Math.trunc(filters.page ?? 1));
  const perPage = Math.min(48, Math.max(1, Math.trunc(filters.perPage ?? 12)));

  if (invalid) {
    return { items: [], total: 0, page: 1, pages: 0, perPage, facets: emptyFacets() };
  }

  const sizeColorWhere: PrismaWhere = { ...where };
  const optionConditions: PrismaWhere[] = [];
  if (filters.sizes?.length) {
    optionConditions.push({
      options: { some: { attribute: "Size", value: { in: filters.sizes } } },
    });
  }
  if (filters.colors?.length) {
    optionConditions.push({
      options: { some: { attribute: "Color", value: { in: filters.colors } } },
    });
  }
  if (optionConditions.length) {
    sizeColorWhere.variants = { some: { AND: optionConditions } };
  }
  if (filters.inStock) {
    sizeColorWhere.stock = { gt: 0 };
  }

  const sort = SORT_ORDER[filters.sort ?? "newest"];

  const [total, products, optionRows, priceAgg] = await Promise.all([
    db.product.count({ where: sizeColorWhere }),
    db.product.findMany({
      where: sizeColorWhere,
      orderBy: sort,
      skip: (page - 1) * perPage,
      take: perPage,
      select: PRODUCT_SELECT,
    }),
    db.variantOption.findMany({
      where: { product: where },
      select: { attribute: true, value: true, swatch: true },
    }),
    db.product.aggregate({
      where: sizeColorWhere,
      _min: { price: true },
      _max: { price: true },
    }),
  ]);

  const items = products.map((product) =>
    toItemDTO(product, locale, promotionPercentFor(product, promotions)),
  );

  return {
    items,
    total,
    page,
    pages: Math.ceil(total / perPage),
    perPage,
    facets: computeFacets(optionRows, priceAgg._min.price, priceAgg._max.price),
  };
}

function emptyFacets(): ProductFacets {
  return { sizes: [], colors: [], priceMinMinor: null, priceMaxMinor: null };
}

function computeFacets(
  optionRows: { attribute: string; value: string; swatch: string | null }[],
  priceMin: number | null,
  priceMax: number | null,
): ProductFacets {
  const sizeCounts = new Map<string, number>();
  const colorMap = new Map<string, { swatch: string | null; count: number }>();

  for (const row of optionRows) {
    if (row.attribute === "Size") {
      sizeCounts.set(row.value, (sizeCounts.get(row.value) ?? 0) + 1);
    } else if (row.attribute === "Color") {
      const existing = colorMap.get(row.value);
      colorMap.set(row.value, {
        swatch: existing?.swatch ?? row.swatch,
        count: (existing?.count ?? 0) + 1,
      });
    }
  }

  return {
    sizes: [...sizeCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    colors: [...colorMap.entries()].map(([value, entry]) => ({
      value,
      swatch: entry.swatch,
      count: entry.count,
    })),
    priceMinMinor: priceMin,
    priceMaxMinor: priceMax,
  };
}

const BASE_DETAIL_SELECT = {
  ...PRODUCT_SELECT,
  variants: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true,
      sku: true,
      price: true,
      stock: true,
      options: {
        select: { id: true, attribute: true, value: true, swatch: true },
      },
    },
  },
} as const;

export async function getProductBySlug(
  slug: string,
  locale: Locale = "fr",
  options: { includeUnpublished?: boolean } = {},
): Promise<ProductDetail | null> {
  const product = await db.product.findFirst({
    where: {
      slug,
      ...(options.includeUnpublished ? {} : { status: "ACTIVE" as ProductStatus }),
    },
    select: BASE_DETAIL_SELECT,
  });

  if (!product) return null;
  const promotions = await loadPromotionMap();
  const promoPercent = promotionPercentFor(product, promotions);

  const relatedRaw = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      status: "ACTIVE",
      NOT: { id: product.id },
    },
    orderBy: [{ salesCount: "desc" }, { rating: "desc" }],
    take: 8,
    select: PRODUCT_SELECT,
  });

  const base = toItemDTO(product, locale, promoPercent);
  const sale = resolveSalePrice(product.price, product.compareAtPrice, promoPercent);

  const variants: ProductVariantDTO[] = product.variants.map((variant) => {
    const variantBase = variant.price ?? product.price;
    const variantSale = resolveSalePrice(variantBase, null, promoPercent);
    const label = variant.options.map((o) => o.value).join(" / ");
    return {
      id: variant.id,
      sku: variant.sku,
      label: label || variant.sku,
      priceMinor: variantSale.priceMinor,
      stock: variant.stock,
      inStock: variant.stock > 0,
      options: variant.options.map((o) => ({
        attribute: o.attribute,
        value: o.value,
        swatch: o.swatch,
      })),
    };
  });

  return {
    ...base,
    priceMinor: sale.priceMinor,
    compareAtMinor: sale.compareAtMinor,
    discountPercent: sale.discountPercentValue,
    onSale: sale.onSale,
    sku: product.sku,
    description: localizedDescription(product, locale),
    weightGrams: product.weightGrams,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    images: product.images.map((image) => ({ url: image.url, alt: image.alt })),
    category: {
      id: product.category.id,
      slug: product.category.slug,
      name: localizedName(product.category, locale),
    },
    subcategory: product.subcategory
      ? {
          id: product.subcategory.id,
          slug: product.subcategory.slug,
          name: localizedName(product.subcategory, locale),
        }
      : null,
    options: product.options,
    variants,
    hasVariants: product.variants.length > 0,
    related: relatedRaw.map((item) =>
      toItemDTO(item, locale, promotionPercentFor(item, promotions)),
    ),
  };
}

export async function getFeaturedProducts(locale: Locale, limit = 8): Promise<ProductListItem[]> {
  const promotions = await loadPromotionMap();
  const products = await db.product.findMany({
    where: { status: "ACTIVE", featured: true },
    orderBy: [{ salesCount: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: PRODUCT_SELECT,
  });
  return products.map((p) => toItemDTO(p, locale, promotionPercentFor(p, promotions)));
}

export async function getNewArrivals(locale: Locale, limit = 8): Promise<ProductListItem[]> {
  const promotions = await loadPromotionMap();
  const products = await db.product.findMany({
    where: { status: "ACTIVE", isNew: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: PRODUCT_SELECT,
  });
  return products.map((p) => toItemDTO(p, locale, promotionPercentFor(p, promotions)));
}

export async function getBestSellers(locale: Locale, limit = 8): Promise<ProductListItem[]> {
  const promotions = await loadPromotionMap();
  const products = await db.product.findMany({
    where: { status: "ACTIVE", bestSeller: true },
    orderBy: { salesCount: "desc" },
    take: limit,
    select: PRODUCT_SELECT,
  });
  return products.map((p) => toItemDTO(p, locale, promotionPercentFor(p, promotions)));
}

export async function getPromotionProducts(locale: Locale, limit = 8): Promise<ProductListItem[]> {
  const promotions = await loadPromotionMap();
  const hasPromotionProducts = promotions.byProduct.size > 0 || promotions.byCategory.size > 0;

  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      ...(hasPromotionProducts ? {} : { compareAtPrice: { not: null } }),
    },
    orderBy: [{ salesCount: "desc" }, { createdAt: "desc" }],
    take: limit * 3,
    select: PRODUCT_SELECT,
  });

  const withSale = products.filter((p) => {
    const promo = promotionPercentFor(p, promotions);
    const sale = resolveSalePrice(p.price, p.compareAtPrice, promo);
    return sale.onSale;
  });

  return withSale
    .slice(0, limit)
    .map((p) => toItemDTO(p, locale, promotionPercentFor(p, promotions)));
}

export interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  priceMinor: number;
  image: string | null;
}

export async function searchSuggestions(
  q: string,
  locale: Locale = "fr",
  limit = 6,
): Promise<SearchSuggestion[]> {
  const term = q.trim();
  if (term.length < 2) return [];

  const promotions = await loadPromotionMap();
  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { nameFr: { contains: term, mode: "insensitive" } },
        { nameEn: { contains: term, mode: "insensitive" } },
        { nameAr: { contains: term } },
        { sku: { contains: term, mode: "insensitive" } },
      ],
    },
    orderBy: [{ salesCount: "desc" }],
    take: limit,
    select: PRODUCT_SELECT,
  });

  return products.map((p) => {
    const sale = resolveSalePrice(
      p.price,
      p.compareAtPrice,
      promotionPercentFor(p, promotions),
    );
    return {
      id: p.id,
      name: localizedName(p, locale),
      slug: p.slug,
      priceMinor: sale.priceMinor,
      image: p.images[0]?.url ?? null,
    };
  });
}

// ── Checkout helpers ──────────────────────────────────────────

export interface CheckoutItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface PricedCheckoutItem {
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  sku: string;
  imageUrl: string | null;
  variantLabel: string | null;
  unitPriceMinor: number;
  basePriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
  stockAvailable: number;
}

/**
 * Loads products + variants for checkout/order creation with final
 * (promotion-applied) prices. Throws when something is unpublished/missing.
 */
export async function priceCheckoutItems(
  items: CheckoutItemInput[],
): Promise<{ priced: PricedCheckoutItem[]; originalSubtotalMinor: number }> {
  if (!items.length) return { priced: [], originalSubtotalMinor: 0 };

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await db.product.findMany({
    where: { id: { in: productIds }, status: "ACTIVE" },
    select: {
      id: true,
      slug: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      categoryId: true,
      subcategoryId: true,
      nameFr: true,
      nameAr: true,
      nameEn: true,
      subcategory: { select: { categoryId: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      variants: {
        select: {
          id: true,
          sku: true,
          price: true,
          stock: true,
          options: { select: { attribute: true, value: true } },
        },
      },
    },
  });

  const promotions = await loadPromotionMap();
  const byId = new Map(products.map((p) => [p.id, p]));

  const priced: PricedCheckoutItem[] = [];
  let originalSubtotal = 0;

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} is not available`);
    }

    const promo = promotionPercentFor(
      {
        id: product.id,
        categoryId: product.categoryId,
        subcategoryCategoryId: product.subcategory?.categoryId ?? null,
      },
      promotions,
    );

    const variant = item.variantId
      ? product.variants.find((v) => v.id === item.variantId)
      : undefined;

    if (item.variantId && !variant) {
      throw new Error(`Variant ${item.variantId} not found for product ${product.slug}`);
    }

    const base = variant?.price ?? product.price;
    const sale = resolveSalePrice(base, variant ? null : product.compareAtPrice, promo);

    const stockAvailable = variant ? variant.stock : product.stock;
    const quantity = Math.max(1, Math.trunc(item.quantity));

    priced.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      name: localizedName(product, "fr"),
      slug: product.slug,
      sku: variant?.sku ?? product.sku,
      imageUrl: product.images[0]?.url ?? null,
      variantLabel: variant
        ? variant.options
            .map((o) => o.value)
            .join(" / ") || variant.sku
        : null,
      unitPriceMinor: sale.priceMinor,
      basePriceMinor: base,
      quantity,
      lineTotalMinor: sale.priceMinor * quantity,
      stockAvailable,
    });

    originalSubtotal += base * quantity;
  }

  return { priced, originalSubtotalMinor: originalSubtotal };
}
