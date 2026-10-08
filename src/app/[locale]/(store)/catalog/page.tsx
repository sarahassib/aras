import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { type Locale, LOCALES } from "@/lib/business-rules";
import {
  listProducts,
  type ProductFilters,
  type ProductSortKey,
} from "@/services/products";
import { getNavigationCategories } from "@/services/categories";
import { ProductCard } from "@/components/store/product-card";
import { CatalogFilters } from "@/components/store/catalog-filters";
import { CatalogToolbar } from "@/components/store/catalog-toolbar";
import { Pagination } from "@/components/store/pagination";
import { formatMAD } from "@/lib/money";

export const metadata: Metadata = { title: "Boutique" };

const SORT_KEYS: ProductSortKey[] = [
  "newest",
  "popular",
  "rating",
  "price_asc",
  "price_desc",
];

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

function toNumber(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "catalog" });
  const appLocale = (LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "fr";

  const sort = SORT_KEYS.includes(sp.sort as ProductSortKey)
    ? (sp.sort as ProductSortKey)
    : "newest";

  const filters: ProductFilters = {
    q: typeof sp.q === "string" && sp.q.trim() ? sp.q.trim() : undefined,
    categorySlug: typeof sp.category === "string" ? sp.category : undefined,
    subcategorySlug: typeof sp.sub === "string" ? sp.sub : undefined,
    minPriceMinor: toNumber(sp.min),
    maxPriceMinor: toNumber(sp.max),
    onSale: sp.sale === "1" || sp.sale === "true",
    inStock: sp.stock === "1" || sp.stock === "true",
    sizes: toArray(sp.size),
    colors: toArray(sp.color),
    sort,
    page: toNumber(sp.page) ?? 1,
    perPage: 12,
  };

  const [result, categories] = await Promise.all([
    listProducts(filters, appLocale),
    getNavigationCategories(appLocale),
  ]);

  const activeCategory = categories.find((c) => c.slug === filters.categorySlug);
  const title = filters.q ? t("searchTitle", { q: filters.q }) : (activeCategory?.name ?? t("title"));

  return (
    <div className="container-store section-spacing">
      <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            {t("title")}
          </Link>
          {activeCategory && (
            <>
              <span>/</span>
              <span className="text-foreground">{activeCategory.name}</span>
            </>
          )}
        </nav>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <CatalogFilters
          locale={locale}
          categories={categories}
          activeCategory={filters.categorySlug}
          activeSub={filters.subcategorySlug}
          facets={result.facets}
          onSale={!!filters.onSale}
          inStock={!!filters.inStock}
          searchParams={sp}
        />

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="heading-display text-2xl md:text-3xl">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("resultsCount", { count: result.total })}
              </p>
            </div>
            <CatalogToolbar
              locale={locale}
              sort={sort}
            />
          </div>

          {result.items.length === 0 ? (
            <div className="rounded-xl border bg-muted/50 px-6 py-16 text-center">
              <p className="text-lg font-semibold text-navy-950">{t("emptyTitle")}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t("emptyText")}</p>
              <Link
                href="/catalog"
                className="mt-6 inline-flex rounded-full bg-navy-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
              >
                {t("clearFilters")}
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {result.items.map((product) => (
                  <ProductCard key={product.id} product={product} locale={locale} />
                ))}
              </div>
              <Pagination
                locale={locale}
                page={result.page}
                pages={result.pages}
                searchParams={sp}
                label={{
                  prev: "←",
                  next: "→",
                }}
              />
            </>
          )}

          {result.facets.priceMinMinor !== null && result.items.length > 0 && (
            <p className="mt-6 text-xs text-muted-foreground">
              {t("priceFrom", { min: formatMAD(result.facets.priceMinMinor) })} ·{" "}
              {t("priceUpTo", { max: formatMAD(result.facets.priceMaxMinor ?? 0) })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
