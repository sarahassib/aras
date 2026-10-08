"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatMAD } from "@/lib/money";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface Suggestion {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  priceMinor: number;
}

export function SearchBar({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(query)}&locale=${locale}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { items: Suggestion[] };
        setItems(data.items);
        setOpen(true);
      } catch {
        /* aborted or offline — ignore */
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, locale]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <form action={`/${locale}/catalog`} className="relative">
        <input type="hidden" name="q" value={q.trim()} />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchAria")}
          className="pe-10"
          autoComplete="off"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="absolute end-0.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={t("searchPlaceholder")}
        >
          <Search className="size-4" />
        </Button>
      </form>

      {open && items.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <ul className="absolute end-0 top-full z-50 mt-1 w-full min-w-72 overflow-hidden rounded-lg border bg-popover shadow-lg">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/product/${item.slug}`}
                  className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      className="size-9 rounded-md border object-cover"
                    />
                  ) : (
                    <span className="size-9 rounded-md border bg-muted" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  <span className="whitespace-nowrap text-muted-foreground">
                    {formatMAD(item.priceMinor)}
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground hover:bg-accent"
                onClick={() => {
                  const el = document.querySelector<HTMLInputElement>(
                    'form[action$="/catalog"] input[name="q"]',
                  );
                  const form = el?.closest("form");
                  if (form) {
                    setOpen(false);
                    form.requestSubmit();
                  }
                }}
              >
                <Search className="size-3.5" />
                {t("searchPlaceholder")}
                <X className="ms-auto size-3.5" />
              </button>
            </li>
          </ul>
        </>
      )}
    </div>
  );
}
