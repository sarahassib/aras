"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { ProductDetail, ProductOptionDTO, ProductVariantDTO } from "@/services/products";
import { formatMAD } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag, Check } from "lucide-react";
import { notifyCartUpdated } from "./cart-badge";

interface Props {
  product: Pick<
    ProductDetail,
    "id" | "slug" | "name" | "priceMinor" | "compareAtMinor" | "onSale" | "discountPercent" | "stock" | "inStock" | "options" | "variants" | "hasVariants"
  >;
}

export function AddToCart({ product }: Props) {
  const t = useTranslations("product");
  const tc = useTranslations("common");
  const router = useRouter();

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle");

  const optionGroups = useMemo(() => {
    const groups = new Map<string, ProductOptionDTO[]>();
    for (const option of product.options) {
      const list = groups.get(option.attribute) ?? [];
      list.push(option);
      groups.set(option.attribute, list);
    }
    return [...groups.entries()].map(([attribute, options]) => ({ attribute, options }));
  }, [product.options]);

  const variant = useMemo<ProductVariantDTO | null>(() => {
    if (!product.hasVariants) return null;
    if (product.options.some((o) => !selected[o.attribute])) return null;
    return (
      product.variants.find((v) =>
        product.options.every((option) =>
          v.options.some((o) => o.attribute === option.attribute && o.value === selected[option.attribute]),
        ),
      ) ?? null
    );
  }, [product, selected]);

  const missingOption = product.options.find((o) => !selected[o.attribute]);
  const unitPrice = variant?.priceMinor ?? product.priceMinor;
  const maxQty = Math.min(
    99,
    variant ? variant.stock : product.stock,
  );
  const canAdd =
    product.inStock && (!missingOption || !product.hasVariants) && (variant || !product.hasVariants) &&
    (!variant || variant.inStock);

  const add = async (buyNow = false) => {
    if (status === "adding" || !canAdd) return;
    setStatus("adding");
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: variant?.id ?? null,
          quantity,
        }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      notifyCartUpdated();
      if (buyNow) {
        router.push("/cart");
        return;
      }
      setStatus("added");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="space-y-5">
      {optionGroups.map(({ attribute, options }) => (
        <div key={attribute}>
          <p className="mb-2 text-sm font-semibold text-navy-950">
            {attribute === "Size" ? t("selectSize") : attribute === "Color" ? t("selectColor") : attribute}
            {selected[attribute] && (
              <span className="ms-2 font-normal text-muted-foreground">
                {selected[attribute]}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map(({ value, swatch }) => {
              const active = selected[attribute] === value;
              if (attribute === "Color") {
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelected((s) => ({ ...s, [attribute]: value }))}
                    title={value}
                    aria-pressed={active}
                    className={`flex size-9 items-center justify-center rounded-full border-2 transition ${
                      active ? "border-navy-950" : "border-border hover:border-foreground"
                    }`}
                  >
                    <span
                      className="size-6 rounded-full border"
                      style={{ backgroundColor: swatch ?? value.toLowerCase() }}
                    />
                  </button>
                );
              }
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelected((s) => ({ ...s, [attribute]: value }))}
                  aria-pressed={active}
                  className={`min-w-11 rounded-md border px-3 py-2 text-sm transition ${
                    active
                      ? "border-navy-950 bg-navy-950 text-white"
                      : "border-border text-foreground hover:border-foreground"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {missingOption && product.hasVariants && status !== "error" && (
        <p className="text-xs text-muted-foreground">{t("selectOptions")}</p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded-full border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="-"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(Math.max(1, maxQty), q + 1))}
            className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="+"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {maxQty > 0 && maxQty <= 5 && (
          <span className="text-xs font-medium text-warning">{tc("lowStock", { count: maxQty })}</span>
        )}
      </div>

      {maxQty === 0 || (!variant && product.hasVariants && !missingOption) ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {tc("outOfStock")} — {t("outOfStockText")}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="flex-1 rounded-full bg-navy-950 text-white hover:bg-navy-800"
          disabled={!canAdd || status === "adding"}
          onClick={() => add(false)}
        >
          {status === "added" ? (
            <>
              <Check className="size-4" /> {tc("added")}
            </>
          ) : status === "adding" ? (
            tc("adding")
          ) : (
            <>
              <ShoppingBag className="size-4" /> {tc("addToCart")}
            </>
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 rounded-full border-gold-500 text-navy-950 hover:bg-gold-50"
          disabled={!canAdd || status === "adding"}
          onClick={() => add(true)}
        >
          {t("buyNow")} — {formatMAD(unitPrice * quantity)}
        </Button>
      </div>

      {status === "error" && (
        <p className="text-sm text-destructive">{tc("error")}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {t("sku")}: {variant?.sku ?? product.slug.toUpperCase()}
      </p>
    </div>
  );
}
