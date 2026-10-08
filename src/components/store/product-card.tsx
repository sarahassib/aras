import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ProductListItem } from "@/services/products";
import { Badge } from "@/components/ui/badge";
import { Price } from "./price";

export async function ProductCard({
  product,
  locale,
}: {
  product: ProductListItem;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition hover:shadow-lg">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            ARAS
          </div>
        )}
        <div className="absolute start-2 top-2 flex flex-col gap-1">
          {product.onSale && product.discountPercent > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">
              -{product.discountPercent}%
            </Badge>
          )}
          {product.isNew && <Badge className="bg-navy-950 text-white">{t("new")}</Badge>}
          {!product.inStock && (
            <Badge variant="outline" className="bg-background/90">
              {t("outOfStock")}
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 md:p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {product.categorySlug.replace(/-/g, " ")}
        </p>
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 text-sm font-medium leading-snug text-navy-950 hover:text-gold-600 md:text-base"
        >
          {product.name}
        </Link>
        {product.rating > 0 && (
          <p className="text-xs text-muted-foreground">
            <span className="text-gold-500">★</span> {product.rating.toFixed(1)} (
            {product.reviewCount})
          </p>
        )}
        <div className="mt-auto pt-1">
          <Price priceMinor={product.priceMinor} compareAtMinor={product.compareAtMinor} />
        </div>
      </div>
    </div>
  );
}
