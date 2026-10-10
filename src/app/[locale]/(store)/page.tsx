import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { type Locale, LOCALES } from "@/lib/business-rules";
import {
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getPromotionProducts,
} from "@/services/products";
import { ProductCard } from "@/components/store/product-card";

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

  const [featured, arrivals, best, promos] = await Promise.all([
    getFeaturedProducts(appLocale, 12),
    getNewArrivals(appLocale, 8),
    getBestSellers(appLocale, 8),
    getPromotionProducts(appLocale, 8),
  ]);

  return (
    <div className="container-store section-spacing">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="heading-display text-2xl md:text-4xl">{t("hero.title")}</h1>
        <Link
          href="/catalog"
          className="text-sm font-medium text-gold-600 hover:text-gold-500"
        >
          → {t("hero.cta")}
        </Link>
      </div>

      {featured.length > 0 && (
        <Section title={t("featuredTitle")} locale={locale} products={featured} />
      )}
      {arrivals.length > 0 && (
        <Section title={t("newTitle")} locale={locale} products={arrivals} muted />
      )}
      {best.length > 0 && <Section title={t("bestTitle")} locale={locale} products={best} />}
      {promos.length > 0 && (
        <Section title={t("promoTitle")} locale={locale} products={promos} muted />
      )}

      {featured.length === 0 &&
        arrivals.length === 0 &&
        best.length === 0 &&
        promos.length === 0 && (
          <p className="py-20 text-center text-muted-foreground">{t("emptySection")}</p>
        )}
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
    <section className={muted ? "-mx-4 rounded-2xl bg-muted px-4 py-8 md:-mx-6 md:px-6" : ""}>
      <div className={muted ? "" : "section-spacing"}>
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="heading-display text-xl md:text-3xl">{title}</h2>
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
