import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TrackForm } from "@/components/store/track-form";

export const metadata: Metadata = { title: "Suivi de commande" };

export default async function TrackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "order" });

  return (
    <div className="container-store section-spacing">
      <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center shadow-xs">
        <h1 className="heading-display text-3xl">{t("trackTitle")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("trackText")}</p>
        <div className="mt-7">
          <TrackForm placeholder={t("trackPlaceholder")} cta={t("trackCta")} />
        </div>
      </div>
    </div>
  );
}
