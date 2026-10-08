import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/store/auth-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <div className="container-store section-spacing">
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 shadow-xs">
        <h1 className="heading-display text-2xl">{t("registerTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("registerSubtitle")}</p>
        <div className="mt-7">
          <AuthForm mode="register" />
        </div>
      </div>
    </div>
  );
}
