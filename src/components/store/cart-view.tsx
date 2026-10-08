"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { formatMAD } from "@/lib/money";
import type { CartDTO } from "@/services/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, Tag, Loader2, ArrowRight } from "lucide-react";
import { notifyCartUpdated } from "./cart-badge";

type LoadState = "loading" | "ready" | "error";

export function CartView() {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [state, setState] = useState<LoadState>("loading");
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [code, setCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [lineBusy, setLineBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/cart?locale=${locale}`, { cache: "no-store" });
      if (!res.ok) throw new Error("cart");
      const data = (await res.json()) as CartDTO;
      setCart(data);
      setState("ready");
      setCode(data.couponCode ?? "");
    } catch {
      setState("error");
    }
  }, [locale]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch resolves asynchronously
    load();
  }, [load]);

  const updateQty = async (itemId: string, quantity: number) => {
    setLineBusy(itemId);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        notifyCartUpdated();
        await load();
      }
    } finally {
      setLineBusy(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setLineBusy(itemId);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" });
      if (res.ok) {
        notifyCartUpdated();
        await load();
      }
    } finally {
      setLineBusy(null);
    }
  };

  const applyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || couponBusy) return;
    setCouponBusy(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/cart/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = (await res.json()) as { error?: { code?: string; message?: string } };
      if (!res.ok) {
        setCouponError(data.error?.message ?? t("couponInvalid"));
        return;
      }
      await load();
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = async () => {
    setCouponBusy(true);
    try {
      await fetch("/api/cart/coupon", { method: "DELETE" });
      await load();
    } finally {
      setCouponBusy(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state === "error" || !cart) {
    return <p className="py-24 text-center text-muted-foreground">{tc("error")}</p>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-2xl border bg-muted/40 px-6 py-20 text-center">
        <p className="text-xl font-semibold text-navy-950">{t("emptyTitle")}</p>
        <p className="mt-2 text-muted-foreground">{t("emptyText")}</p>
        <Link
          href="/catalog"
          className="mt-8 inline-flex rounded-full bg-navy-950 px-7 py-3 text-sm font-semibold text-white hover:bg-navy-800"
        >
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Items */}
      <div className="space-y-4">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 rounded-xl border bg-card p-4 shadow-xs"
          >
            <Link
              href={`/product/${item.slug}`}
              className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted md:size-24"
            >
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-xs text-navy-300">
                  ARAS
                </div>
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/product/${item.slug}`}
                    className="line-clamp-2 text-sm font-medium text-navy-950 hover:text-gold-600"
                  >
                    {item.name}
                  </Link>
                  {item.variantLabel && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.variantLabel}</p>
                  )}
                  {item.onSale && item.discountPercent > 0 && (
                    <p className="mt-0.5 text-xs font-semibold text-destructive">
                      -{item.discountPercent}%
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={lineBusy === item.id}
                  aria-label={tc("remove")}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                <div className="flex items-center rounded-full border">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                    disabled={lineBusy === item.id || item.quantity <= 1}
                    className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                    aria-label="-"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-semibold">
                    {lineBusy === item.id ? "…" : item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQty(item.id, Math.min(item.maxQuantity, item.quantity + 1))
                    }
                    disabled={lineBusy === item.id || item.quantity >= item.maxQuantity}
                    className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                    aria-label="+"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <div className="text-end">
                  <p className="text-sm font-semibold text-navy-950">
                    {formatMAD(item.lineTotalMinor)}
                  </p>
                  {item.onSale && (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatMAD(item.basePriceMinor * item.quantity)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        <Link
          href="/catalog"
          className="inline-block text-sm font-medium text-gold-600 hover:text-gold-500"
        >
          ← {t("continueShopping")}
        </Link>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-xl border bg-card p-5 shadow-xs lg:sticky lg:top-56">
        <h2 className="text-lg font-semibold text-navy-950">{t("orderSummaryLabel")}</h2>

        <form onSubmit={applyCoupon} className="mt-4 flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t("couponPlaceholder")}
            className="flex-1"
            aria-label={t("coupon")}
          />
          {cart.couponCode ? (
            <Button type="button" variant="outline" onClick={removeCoupon} disabled={couponBusy}>
              {t("couponRemove")}
            </Button>
          ) : (
            <Button type="submit" disabled={couponBusy || !code.trim()}>
              {couponBusy ? <Loader2 className="size-4 animate-spin" /> : <Tag className="size-4" />}
            </Button>
          )}
        </form>
        {couponError && <p className="mt-2 text-xs text-destructive">{couponError}</p>}
        {cart.couponCode && (
          <p className="mt-2 flex items-center gap-1 text-xs text-success">
            <Tag className="size-3.5" /> {t("couponApplied", { code: cart.couponCode })}
          </p>
        )}

        <dl className="mt-5 space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("subtotal")}</dt>
            <dd className="font-medium">{formatMAD(cart.subtotalMinor)}</dd>
          </div>
          {cart.itemDiscountMinor > 0 && (
            <div className="flex justify-between text-success">
              <dt>{t("savings")}</dt>
              <dd>-{formatMAD(cart.itemDiscountMinor)}</dd>
            </div>
          )}
          {cart.couponDiscountMinor > 0 && (
            <div className="flex justify-between text-success">
              <dt>
                {t("coupon")} ({cart.couponCode})
              </dt>
              <dd>-{formatMAD(cart.couponDiscountMinor)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("shipping")}</dt>
            <dd className="text-xs text-muted-foreground">{t("shippingCalculated")}</dd>
          </div>
          <div className="flex justify-between border-t pt-3 text-base font-semibold">
            <dt>{t("totalToPay")}</dt>
            <dd className="text-navy-950">{formatMAD(cart.totals.totalMinor)}</dd>
          </div>
        </dl>

        <Button
          className="mt-5 w-full rounded-full bg-gold-500 text-navy-950 hover:bg-gold-400"
          size="lg"
          onClick={() => router.push("/checkout")}
        >
          {t("checkout")} <ArrowRight className="ms-2 size-4 rtl:rotate-180" />
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">{t("checkoutSecure")}</p>
      </aside>
    </div>
  );
}
