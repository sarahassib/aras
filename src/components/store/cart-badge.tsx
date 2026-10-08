"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

export function CartBadge() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/cart?locale=${locale}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { itemCount?: number };
        if (!cancelled) setCount(data.itemCount ?? 0);
      } catch {
        if (!cancelled) setCount(0);
      }
    };
    load();
    const onUpdate = () => load();
    window.addEventListener("aras:cart-updated", onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("aras:cart-updated", onUpdate);
    };
  }, [locale]);

  const label =
    count === null ? t("cart") : t("cartCount", { count });

  return (
    <Button variant="ghost" size="icon" asChild className="relative" aria-label={label}>
      <Link href="/cart">
        <ShoppingBag className="size-5" />
        {count !== null && count > 0 && (
          <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-bold leading-none text-navy-950">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}

export function notifyCartUpdated() {
  window.dispatchEvent(new CustomEvent("aras:cart-updated"));
}
