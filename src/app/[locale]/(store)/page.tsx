import { getTranslations } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <main className="container-store section-spacing">
      <h1 className="heading-display text-4xl md:text-6xl">{t("title")}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{t("tagline")}</p>
    </main>
  );
}
