import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CartView } from "@/components/store/cart-view";

export const metadata: Metadata = { title: "Panier" };

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cart" });

  return (
    <div className="container-store section-spacing">
      <h1 className="heading-display mb-8 text-3xl md:text-4xl">{t("title")}</h1>
      <CartView />
    </div>
  );
}
