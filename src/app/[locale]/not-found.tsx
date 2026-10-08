import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("errors");
  const tc = await getTranslations("common");

  return (
    <div className="container-store flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="heading-display text-7xl font-bold text-gold-500">404</p>
      <h1 className="heading-display mt-4 text-2xl md:text-3xl">{t("notFoundTitle")}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{t("notFoundText")}</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-navy-950 px-7 py-3 text-sm font-semibold text-white hover:bg-navy-800"
      >
        {tc("goHome")}
      </Link>
    </div>
  );
}
