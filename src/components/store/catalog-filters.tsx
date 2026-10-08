import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CategoryDTO } from "@/services/categories";
import type { ProductFacets } from "@/services/products";
import { buildQuery, toggleArrayValue, type QueryValue } from "./query";
import { formatMAD } from "@/lib/money";

interface Props {
  locale: string;
  categories: CategoryDTO[];
  activeCategory?: string;
  activeSub?: string;
  facets: ProductFacets;
  onSale: boolean;
  inStock: boolean;
  searchParams: Record<string, QueryValue>;
}

const PRICE_STEPS = [0, 10000, 25000, 50000, 100000, 200000];

export async function CatalogFilters({
  locale,
  categories,
  activeCategory,
  activeSub,
  facets,
  onSale,
  inStock,
  searchParams,
}: Props) {
  const t = await getTranslations({ locale, namespace: "catalog" });

  const category = categories.find((c) => c.slug === activeCategory);
  const currentSizes = searchParams.size ?? [];
  const currentColors = searchParams.color ?? [];
  const sizeList = (Array.isArray(currentSizes) ? currentSizes : [currentSizes]).filter(Boolean);
  const colorList = (Array.isArray(currentColors) ? currentColors : [currentColors]).filter(Boolean);

  const hasFilters =
    !!activeCategory || sizeList.length > 0 || colorList.length > 0 || onSale || inStock;

  return (
    <aside className="space-y-6 lg:sticky lg:top-56 lg:self-start">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-950">
            {t("filters")}
          </h2>
          {hasFilters && (
            <Link href="/catalog" className="text-xs font-medium text-gold-600 hover:text-gold-500">
              {t("clearFilters")}
            </Link>
          )}
        </div>

        {/* Categories */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("category")}
          </p>
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                href="/catalog"
                className={`block rounded-md px-2 py-1.5 ${
                  !activeCategory ? "bg-accent font-semibold text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("clearFilters")}
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/catalog${buildQuery(searchParams, { category: c.slug, sub: undefined, page: undefined })}`}
                  className={`block rounded-md px-2 py-1.5 ${
                    c.slug === activeCategory
                      ? "bg-accent font-semibold text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.name}
                </Link>
                {c.slug === activeCategory && c.subcategories.length > 0 && (
                  <ul className="ms-3 mt-1 space-y-1 border-s ps-2">
                    {c.subcategories.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/catalog${buildQuery(searchParams, { sub: s.slug, page: undefined })}`}
                          className={`block rounded-md px-2 py-1 text-xs ${
                            s.slug === activeSub
                              ? "font-semibold text-gold-700"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Price */}
        <div className="mt-5 border-t pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("price")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRICE_STEPS.map((step, i) => {
              const next = PRICE_STEPS[i + 1];
              const isActive =
                String(searchParams.min ?? "") === String(step) &&
                (next === undefined || String(searchParams.max ?? "") === String(next));
              const label = next
                ? `${formatMAD(step)} – ${formatMAD(next)}`
                : `≥ ${formatMAD(step)}`;
              const href = next
                ? buildQuery(searchParams, { min: String(step), max: String(next), page: undefined })
                : buildQuery(searchParams, { min: String(step), max: undefined, page: undefined });
              return (
                <Link
                  key={step}
                  href={`/catalog${href}`}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    isActive
                      ? "border-navy-950 bg-navy-950 text-white"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sizes */}
        {facets.sizes.length > 0 && (
          <div className="mt-5 border-t pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("size")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {facets.sizes.map((size) => {
                const active = sizeList.includes(size.value);
                const href = `/catalog${buildQuery(searchParams, {
                  size: toggleArrayValue(searchParams.size, size.value),
                  page: undefined,
                })}`;
                return (
                  <Link
                    key={size.value}
                    href={href}
                    className={`rounded-md border px-2.5 py-1 text-xs transition ${
                      active
                        ? "border-navy-950 bg-navy-950 text-white"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {size.value} <span className="opacity-60">({size.count})</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Colors */}
        {facets.colors.length > 0 && (
          <div className="mt-5 border-t pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("color")}
            </p>
            <div className="flex flex-wrap gap-2">
              {facets.colors.map((color) => {
                const active = colorList.includes(color.value);
                return (
                  <Link
                    key={color.value}
                    href={`/catalog${buildQuery(searchParams, {
                      color: toggleArrayValue(searchParams.color, color.value),
                      page: undefined,
                    })}`}
                    title={`${color.value} (${color.count})`}
                    className={`flex items-center gap-1.5 rounded-full border py-1 pe-2.5 ps-1 text-xs transition ${
                      active
                        ? "border-navy-950 bg-navy-950 text-white"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    <span
                      className="size-4 rounded-full border"
                      style={{ backgroundColor: color.swatch ?? color.value.toLowerCase() }}
                    />
                    {color.value}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Toggles */}
        <div className="mt-5 space-y-3 border-t pt-4 text-sm">
          <Link
            href={`/catalog${buildQuery(searchParams, { sale: onSale ? "0" : "1", page: undefined })}`}
            className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground"
          >
            <span
              className={`flex size-4 shrink-0 items-center justify-center rounded-[4px] border ${
                onSale ? "border-navy-950 bg-navy-950" : "border-input bg-background"
              }`}
            >
              {onSale && <span className="text-[10px] font-bold leading-none text-white">✓</span>}
            </span>
            {t("onSale")}
          </Link>
          <Link
            href={`/catalog${buildQuery(searchParams, { stock: inStock ? "0" : "1", page: undefined })}`}
            className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground"
          >
            <span
              className={`flex size-4 shrink-0 items-center justify-center rounded-[4px] border ${
                inStock ? "border-navy-950 bg-navy-950" : "border-input bg-background"
              }`}
            >
              {inStock && <span className="text-[10px] font-bold leading-none text-white">✓</span>}
            </span>
            {t("inStock")}
          </Link>
        </div>
      </div>
    </aside>
  );
}
