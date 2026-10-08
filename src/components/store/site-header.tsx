import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getNavigationCategories } from "@/services/categories";
import { getSettings } from "@/services/settings";
import { type Locale, LOCALES } from "@/lib/business-rules";
import { SearchBar } from "./search-bar";
import { CartBadge } from "./cart-badge";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

export async function SiteHeader({ locale }: { locale: string }) {
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");
  const appLocale = (LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "fr";
  const [categories, settings] = await Promise.all([
    getNavigationCategories(appLocale),
    getSettings(appLocale),
  ]);
  const announcement = settings.announcement[appLocale];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {announcement && (
        <div className="bg-navy-950 text-center text-xs leading-relaxed text-navy-100">
          <div className="container-store py-2">{announcement}</div>
        </div>
      )}

      <div className="container-store flex h-16 items-center gap-3 md:h-20 md:gap-6">
        <div className="flex items-center gap-2 lg:hidden">
          <MobileNav categories={categories} />
        </div>

        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={tc("brand")}>
          <span className="heading-display text-2xl font-bold tracking-tight text-navy-950">
            {tc("brand")}
          </span>
          <span className="hidden h-4 w-px bg-gold-500 sm:block" />
          <span className="hidden text-xs text-muted-foreground sm:block">{tc("tagline")}</span>
        </Link>

        <SearchBar className="hidden max-w-2xl flex-1 md:block" />

        <div className="ms-auto flex items-center gap-1">
          <LocaleSwitcher />
          <UserMenu />
          <CartBadge />
        </div>
      </div>

      <div className="container-store border-t py-2 md:hidden">
        <SearchBar />
      </div>

      <nav className="container-store hidden items-center gap-6 border-t py-3 text-sm md:flex">
        <Link href="/catalog" className="font-semibold text-navy-950 hover:text-gold-600">
          {t("shop")}
        </Link>
        {categories.map((category) => (
          <div key={category.id} className="group relative">
            <Link
              href={`/catalog?category=${category.slug}`}
              className="flex items-center gap-1 py-1 text-muted-foreground hover:text-foreground"
            >
              {category.name}
            </Link>
            {category.subcategories.length > 0 && (
              <div className="invisible absolute start-0 top-full z-50 min-w-52 rounded-lg border bg-popover p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                {category.subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/catalog?category=${category.slug}&sub=${sub.slug}`}
                    className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        <Link href="/catalog?sale=1" className="py-1 text-muted-foreground hover:text-foreground">
          {t("promotions")}
        </Link>
        <Link href="/track" className="py-1 text-muted-foreground hover:text-foreground">
          {t("trackOrder")}
        </Link>
      </nav>
    </header>
  );
}
