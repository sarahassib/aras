import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type Locale, LOCALES } from "@/lib/business-rules";
import { getCartContext } from "@/lib/cart-context";
import { getCart } from "@/services/cart";
import { listDeliveryZones } from "@/services/delivery";
import { getSettings } from "@/services/settings";
import { CheckoutView } from "@/components/store/checkout-view";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });
  const appLocale = (LOCALES as readonly string[]).includes(locale)
    ? (locale as Locale)
    : "fr";

  const context = await getCartContext({ mint: false });
  if (!context.userId && !context.token) {
    redirect("/cart");
  }
  const [cart, zones, settings] = await Promise.all([
    getCart(context, appLocale),
    listDeliveryZones(),
    getSettings(appLocale),
  ]);

  if (cart.items.length === 0) {
    redirect("/cart");
  }

  return (
    <div className="container-store section-spacing">
      <h1 className="heading-display mb-8 text-3xl md:text-4xl">{t("title")}</h1>
      <CheckoutView
        cart={cart}
        zones={zones}
        codEnabled={settings.codEnabled}
        cardEnabled={settings.cardEnabled}
        locale={locale}
      />
    </div>
  );
}
