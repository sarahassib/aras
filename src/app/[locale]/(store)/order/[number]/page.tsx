import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatMAD } from "@/lib/money";
import { getOrderByNumber } from "@/services/orders";

const STATUS_FLOW = ["NEW", "CONFIRMED", "PREPARING", "SHIPPED", "DELIVERED"] as const;

export const metadata: Metadata = { title: "Commande" };

export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string; number: string }>;
}) {
  const { locale, number } = await params;
  const t = await getTranslations({ locale, namespace: "order" });
  const tc = await getTranslations({ locale, namespace: "common" });

  const order = await getOrderByNumber(decodeURIComponent(number).toUpperCase());
  if (!order) notFound();

  const currentIndex = STATUS_FLOW.indexOf(order.status as (typeof STATUS_FLOW)[number]);
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="container-store section-spacing">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border bg-card p-6 text-center shadow-xs md:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-600">
            {t("thankYou")}
          </p>
          <h1 className="heading-display mt-2 text-2xl md:text-3xl">
            {t("title", { number: order.orderNumber })}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("placedAt", { date: order.placedAt.toLocaleString(locale) })}
          </p>

          {/* Timeline */}
          <div className="mt-8">
            <p className="mb-4 text-sm font-semibold text-navy-950">{t("timeline")}</p>
            {isCancelled ? (
              <p className="inline-flex rounded-full bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive">
                {t("status.CANCELLED")}
              </p>
            ) : (
              <ol className="flex items-center">
                {STATUS_FLOW.map((status, i) => {
                  const done = i <= currentIndex;
                  return (
                    <li key={status} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={`flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold ${
                            done
                              ? "border-gold-500 bg-gold-500 text-navy-950"
                              : "border-border bg-background text-muted-foreground"
                          }`}
                        >
                          {done ? "✓" : i + 1}
                        </span>
                        <span
                          className={`hidden text-[11px] sm:block ${
                            done ? "font-semibold text-navy-950" : "text-muted-foreground"
                          }`}
                        >
                          {t(`status.${status}`)}
                        </span>
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <span
                          className={`mx-1 mb-4 h-0.5 flex-1 sm:mx-2 ${
                            i < currentIndex ? "bg-gold-500" : "bg-border"
                          }`}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* Items */}
          <ul className="mt-8 space-y-3 border-t pt-6 text-start">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="size-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.productName}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.variantLabel ? `${item.variantLabel} · ` : ""}×{item.quantity}
                  </span>
                </span>
                <span className="text-sm font-semibold">{formatMAD(item.total)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t pt-4 text-sm text-start">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("subtotal")}</dt>
              <dd>{formatMAD(order.subtotal)}</dd>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-success">
                <dt>{t("discount")}</dt>
                <dd>-{formatMAD(order.discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("delivery")}</dt>
              <dd>{order.deliveryFee === 0 ? tc("free") : formatMAD(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-base font-semibold">
              <dt>{t("total")}</dt>
              <dd>{formatMAD(order.total)}</dd>
            </div>
          </dl>

          <div className="mt-5 grid gap-3 rounded-xl bg-muted/60 p-4 text-start text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("deliveryAddress")}
              </p>
              <p className="mt-1">
                {order.fullName} — {order.city}
                <br />
                {order.addressLine}
                <br />
                {order.phone}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t(`paymentMethod.${order.paymentMethod}`)}
              </p>
              <p className="mt-1">
                {order.payment ? t(`paymentStatus.${order.payment.status}`) : "—"}
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/catalog"
              className="rounded-full bg-navy-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
            >
              {tc("goHome")}
            </Link>
            <Link
              href="/account/orders"
              className="rounded-full border px-6 py-2.5 text-sm font-semibold text-navy-950 hover:bg-accent"
            >
              {t("myOrders")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
