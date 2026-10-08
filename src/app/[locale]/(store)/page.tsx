import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { type Locale, LOCALES } from "@/lib/business-rules";
import { getNavigationCategories } from "@/services/categories";
import { getBanners } from "@/services/banners";
import {
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getPromotionProducts,
} from "@/services/products";
import { ProductCard } from "@/components/store/product-card";
import { Truck, BadgeCheck, RefreshCcw, Headphones } from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const appLocale = (LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "fr";

  const [categories, heroBanners, middleBanners, featured, arrivals, best, promos] =
    await Promise.all([
      getNavigationCategories(appLocale),
      getBanners("HERO", appLocale, 1),
      getBanners("MIDDLE", appLocale, 2),
      getFeaturedProducts(appLocale, 8),
      getNewArrivals(appLocale, 4),
      getBestSellers(appLocale, 4),
      getPromotionProducts(appLocale, 4),
    ]);

  const hero = heroBanners[0];

  const trustItems = [
    { icon: Truck, key: "shipping" },
    { icon: BadgeCheck, key: "cod" },
    { icon: RefreshCcw, key: "returns" },
    { icon: Headphones, key: "support" },
  ] as const;

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero.image}
            alt={hero.title}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        {!hero && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,162,39,0.25),transparent_55%)]" />
        )}
        <div className="container-store relative py-20 md:py-28 lg:py-36">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">
            {hero?.title ?? t("hero.eyebrow")}
          </p>
          <h1 className="heading-display mt-4 max-w-3xl text-balance text-4xl font-semibold text-white md:text-6xl lg:text-7xl">
            {t("hero.title")}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-navy-200 md:text-lg">
            {hero?.description ?? t("hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={hero?.ctaUrl ?? "/catalog"}
              className="inline-flex items-center rounded-full bg-gold-500 px-7 py-3 text-sm font-semibold text-navy-950 transition hover:bg-gold-400"
            >
              {hero?.ctaLabel ?? t("hero.cta")}
            </Link>
            <Link
              href="/catalog?sale=1"
              className="inline-flex items-center rounded-full border border-navy-600 px-7 py-3 text-sm font-semibold text-white transition hover:border-gold-500 hover:text-gold-400"
            >
              {t("hero.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────── */}
      <section className="border-b bg-muted">
        <div className="container-store grid grid-cols-2 gap-6 py-8 md:grid-cols-4">
          {trustItems.map(({ icon: Icon, key }) => (
            <div key={key} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-6 shrink-0 text-gold-600" />
              <div>
                <p className="text-sm font-semibold text-navy-950">{t(`trust.${key}Title`)}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {t(`trust.${key}Text`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      <section className="container-store section-spacing">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="heading-display text-2xl md:text-4xl">{t("categoriesTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("categoriesSubtitle")}</p>
          </div>
          <Link
            href="/catalog"
            className="hidden shrink-0 text-sm font-medium text-gold-600 hover:text-gold-500 sm:block"
          >
            →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog?category=${category.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-muted"
            >
              {category.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl text-navy-300">
                  {category.icon ?? "◆"}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/90 to-transparent p-4">
                <p className="text-sm font-semibold text-white">{category.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured ─────────────────────────────────────────── */}
      {featured.length > 0 && (
        <Section title={t("featuredTitle")} locale={locale} products={featured} />
      )}

      {/* ── Middle banners ───────────────────────────────────── */}
      {middleBanners.length > 0 && (
        <section className="container-store pb-12 md:pb-16">
          <div className="grid gap-4 md:grid-cols-2">
            {middleBanners.map((banner) => (
              <Link
                key={banner.id}
                href={banner.ctaUrl ?? "/catalog"}
                className="group relative aspect-[16/7] overflow-hidden rounded-2xl bg-navy-950"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.image}
                  alt={banner.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-105"
                />
                <div className="relative flex h-full flex-col justify-end p-6">
                  <p className="text-lg font-semibold text-white md:text-2xl">{banner.title}</p>
                  {banner.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-navy-100">
                      {banner.description}
                    </p>
                  )}
                  {banner.ctaLabel && (
                    <span className="mt-3 w-fit rounded-full bg-gold-500 px-4 py-1.5 text-xs font-semibold text-navy-950">
                      {banner.ctaLabel}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── New arrivals / Best sellers / Promos ─────────────── */}
      {arrivals.length > 0 && (
        <Section title={t("newTitle")} locale={locale} products={arrivals} muted />
      )}
      {best.length > 0 && <Section title={t("bestTitle")} locale={locale} products={best} />}
      {promos.length > 0 && <Section title={t("promoTitle")} locale={locale} products={promos} muted />}
    </div>
  );
}

function Section({
  title,
  locale,
  products,
  muted,
}: {
  title: string;
  locale: string;
  products: Parameters<typeof ProductCard>[0]["product"][];
  muted?: boolean;
}) {
  return (
    <section className={muted ? "bg-muted" : ""}>
      <div className="container-store section-spacing">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="heading-display text-2xl md:text-4xl">{title}</h2>
          <Link
            href="/catalog"
            className="shrink-0 text-sm font-medium text-gold-600 hover:text-gold-500"
          >
            →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
