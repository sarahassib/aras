import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getNavigationCategories } from "@/services/categories";
import { getSettings } from "@/services/settings";
import { type Locale, LOCALES } from "@/lib/business-rules";
import { Mail, Phone, MapPin, CreditCard } from "lucide-react";
import { NewsletterForm } from "./newsletter-form";

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations("footer");
  const appLocale = (LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "fr";
  const [categories, settings] = await Promise.all([
    getNavigationCategories(appLocale),
    getSettings(appLocale),
  ]);

  const socials = [
    { key: "facebook", label: "f", href: settings.social.facebook },
    { key: "instagram", label: "IG", href: settings.social.instagram },
    { key: "tiktok", label: "TT", href: settings.social.tiktok },
    { key: "youtube", label: "YT", href: settings.social.youtube },
  ].filter((s) => s.href);

  return (
    <footer className="mt-auto bg-navy-950 text-navy-200">
      <div className="container-store grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt="ARAS" className="h-10 w-auto" />
          ) : (
            <p className="heading-display text-2xl font-bold text-white">ARAS</p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-navy-300">{t("aboutText")}</p>
          <div className="mt-5 space-y-2 text-sm text-navy-300">
            <p className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-gold-500" />
              {settings.address ?? t("contactAddress")}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-gold-500" />
              {settings.phone ?? t("contactPhone")}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-4 shrink-0 text-gold-500" />
              {settings.contactEmail ?? t("contactEmail")}
            </p>
          </div>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-3">
              {socials.map(({ key, label, href }) => (
                <a
                  key={key}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={key}
                  className="flex size-8 items-center justify-center rounded-full border border-navy-700 text-[11px] font-bold text-navy-300 transition hover:border-gold-500 hover:text-gold-400"
                >
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>

        <nav aria-label={t("shopTitle")}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            {t("shopTitle")}
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.slice(0, 6).map((category) => (
              <li key={category.id}>
                <Link href={`/catalog?category=${category.slug}`} className="hover:text-gold-400">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("helpTitle")}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            {t("helpTitle")}
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/track" className="hover:text-gold-400">
                {t("links.trackOrder")}
              </Link>
            </li>
            <li>
              <Link href="/info/delivery" className="hover:text-gold-400">
                {t("links.delivery")}
              </Link>
            </li>
            <li>
              <Link href="/info/returns" className="hover:text-gold-400">
                {t("links.returns")}
              </Link>
            </li>
            <li>
              <Link href="/info/faq" className="hover:text-gold-400">
                {t("links.faq")}
              </Link>
            </li>
            <li>
              <Link href="/info/terms" className="hover:text-gold-400">
                {t("links.terms")}
              </Link>
            </li>
            <li>
              <Link href="/info/privacy" className="hover:text-gold-400">
                {t("links.privacy")}
              </Link>
            </li>
          </ul>
          <div className="mt-6 rounded-lg border border-navy-800 bg-navy-900 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-white">
              <CreditCard className="size-4 text-gold-500" />
              {t("paymentTitle")}
            </p>
            <p className="mt-2 text-xs text-navy-300">{t("paymentCod")}</p>
            <p className="text-xs text-navy-300">{t("paymentCard")} — {t("securedNote")}</p>
          </div>
        </nav>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            {t("newsletterTitle")}
          </h3>
          <p className="mt-4 text-sm text-navy-300">{t("newsletterText")}</p>
          <div className="mt-4">
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="border-t border-navy-800">
        <div className="container-store flex flex-col items-center justify-between gap-2 py-6 text-xs text-navy-400 sm:flex-row">
          <p>{t("rights", { year: new Date().getFullYear() })}</p>
          <p>{t("securedNote")} · SSL</p>
        </div>
      </div>
    </footer>
  );
}
