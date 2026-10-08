import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { type Locale, LOCALES } from "@/lib/business-rules";
import { getProductBySlug } from "@/services/products";
import { getProductReviews } from "@/services/reviews";
import { Price } from "@/components/store/price";
import { ProductGallery } from "@/components/store/product-gallery";
import { AddToCart } from "@/components/store/add-to-cart";
import { ReviewForm } from "@/components/store/review-form";
import { ProductCard } from "@/components/store/product-card";
import { Truck, ShieldCheck, Star } from "lucide-react";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const appLocale = (LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "fr";
  const product = await getProductBySlug(slug, appLocale);
  if (!product) return { title: "ARAS" };
  return {
    title: product.metaTitle ?? product.name,
    description: product.metaDescription ?? product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.metaDescription ?? undefined,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "product" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tn = await getTranslations({ locale, namespace: "nav" });
  const appLocale = (LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "fr";

  const product = await getProductBySlug(slug, appLocale);
  if (!product) notFound();

  const reviews = await getProductReviews(product.id, 1, 6);

  return (
    <div className="container-store section-spacing">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          {tn("home")}
        </Link>
        <span>/</span>
        <Link
          href={`/catalog?category=${product.category.slug}`}
          className="hover:text-foreground"
        >
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.onSale && (
              <span className="rounded-full bg-destructive px-2.5 py-0.5 text-xs font-bold text-white">
                -{product.discountPercent}%
              </span>
            )}
            {product.isNew && (
              <span className="rounded-full bg-navy-950 px-2.5 py-0.5 text-xs font-semibold text-white">
                {tc("new")}
              </span>
            )}
            {product.bestSeller && (
              <span className="rounded-full bg-gold-500 px-2.5 py-0.5 text-xs font-semibold text-navy-950">
                {tc("bestSeller")}
              </span>
            )}
          </div>

          <h1 className="heading-display mt-3 text-3xl md:text-4xl">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            {product.rating > 0 ? (
              <>
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-gold-500 text-gold-500" />
                  <strong className="text-foreground">{product.rating.toFixed(1)}</strong>
                </span>
                <span>({product.reviewCount} {t("reviewsTitle").toLowerCase()})</span>
              </>
            ) : (
              <span>—</span>
            )}
            <span className={product.inStock ? "text-success" : "text-destructive"}>
              {product.inStock ? tc("inStock") : tc("outOfStock")}
            </span>
          </div>

          <div className="mt-5">
            <Price
              priceMinor={product.priceMinor}
              compareAtMinor={product.compareAtMinor}
              size="lg"
            />
          </div>

          {product.description && (
            <p className="mt-5 leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-8 border-t pt-8">
            <AddToCart product={product} />
          </div>

          <div className="mt-8 grid gap-3 rounded-xl border bg-muted/40 p-4 text-sm sm:grid-cols-2">
            <p className="flex items-start gap-2.5">
              <Truck className="mt-0.5 size-4 shrink-0 text-gold-600" />
              <span>
                <strong className="block text-navy-950">{t("shippingInfo")}</strong>
                <span className="text-muted-foreground">{t("shippingText")}</span>
              </span>
            </p>
            <p className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold-600" />
              <span>
                <strong className="block text-navy-950">{tc("brand")}</strong>
                <span className="text-muted-foreground">{t("paymentText")}</span>
              </span>
            </p>
          </div>

          <dl className="mt-6 space-y-1.5 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{t("sku")}:</dt>
              <dd className="font-medium">{product.sku}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">{t("category")}:</dt>
              <dd>{product.category.name}{product.subcategory ? ` / ${product.subcategory.name}` : ""}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16 border-t pt-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <h2 className="heading-display text-2xl">{t("reviewsTitle")}</h2>
            {reviews.items.length === 0 ? (
              <p className="mt-4 text-muted-foreground">{t("reviewsEmpty")}</p>
            ) : (
              <ul className="mt-6 space-y-5">
                {reviews.items.map((review) => (
                  <li key={review.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-navy-950">{review.authorName}</p>
                      <span className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`size-3.5 ${
                              i <= review.rating ? "fill-gold-500 text-gold-500" : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </span>
                    </div>
                    {review.title && <p className="mt-1.5 text-sm font-medium">{review.title}</p>}
                    {review.comment && (
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {review.createdAt.toLocaleDateString(locale)}
                      {review.verified && ` · ${t("reviewVerified")}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border bg-muted/40 p-5">
            <h3 className="mb-4 text-lg font-semibold text-navy-950">{t("writeReview")}</h3>
            <ReviewForm productId={product.id} />
          </div>
        </div>
      </section>

      {/* Related */}
      {product.related.length > 0 && (
        <section className="mt-16 border-t pt-12">
          <h2 className="heading-display mb-6 text-2xl">{t("relatedTitle")}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {product.related.slice(0, 4).map((item) => (
              <ProductCard key={item.id} product={item} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
