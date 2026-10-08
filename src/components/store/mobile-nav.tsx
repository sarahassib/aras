"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingBag } from "lucide-react";
import type { CategoryDTO } from "@/services/categories";

export function MobileNav({ categories }: { categories: CategoryDTO[] }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("menu")}>
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={locale === "ar" ? "right" : "left"} className="flex w-80 flex-col gap-0">
        <SheetHeader>
          <SheetTitle className="heading-display text-lg">{tc("brand")}</SheetTitle>
        </SheetHeader>
        <nav className="mt-4 flex flex-col gap-1 overflow-y-auto pb-8">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            {t("home")}
          </Link>
          <Link
            href="/catalog"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            {t("shop")}
          </Link>
          {categories.map((category) => (
            <div key={category.id} className="py-1">
              <Link
                href={`/catalog?category=${category.slug}`}
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                {category.name}
              </Link>
              {category.subcategories.length > 0 && (
                <div className="ms-4 flex flex-col">
                  {category.subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/catalog?category=${category.slug}&sub=${sub.slug}`}
                      className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => setOpen(false)}
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="my-2 border-t" />
          <Link
            href="/track"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            {t("trackOrder")}
          </Link>
          <Link
            href="/auth/login"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            {tc("signIn")}
          </Link>
          <Link
            href="/cart"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            onClick={() => setOpen(false)}
          >
            <ShoppingBag className="size-4" />
            {t("cart")}
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
