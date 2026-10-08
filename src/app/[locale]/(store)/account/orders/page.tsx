import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireUserPage } from "@/lib/session";
import { listCustomerOrders } from "@/services/orders";
import { formatMAD } from "@/lib/money";

export const metadata: Metadata = { title: "Mes commandes" };

const STATUS_STYLE: Record<string, string> = {
  NEW: "bg-secondary text-secondary-foreground",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-amber-100 text-amber-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default async function AccountOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);

  const t = await getTranslations({ locale, namespace: "order" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const user = await requireUserPage("/account/orders");
  const result = await listCustomerOrders(user.id, page, 12);

  return (
    <div className="container-store section-spacing">
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/account" className="hover:text-foreground">
          ←
        </Link>
        <h1 className="heading-display text-3xl">{t("myOrders")}</h1>
      </nav>

      {result.items.length === 0 ? (
        <div className="rounded-xl border bg-muted/40 px-6 py-16 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Link
            href="/catalog"
            className="mt-6 inline-flex rounded-full bg-navy-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
          >
            {tc("goHome")}
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start">{t("orderNumber")}</th>
                <th className="px-4 py-3 text-start">{t("date")}</th>
                <th className="hidden px-4 py-3 text-start sm:table-cell">{t("statusLabel")}</th>
                <th className="hidden px-4 py-3 text-start md:table-cell">{t("items")}</th>
                <th className="px-4 py-3 text-end">{t("total")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.items.map((order) => (
                <tr key={order.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/order/${order.orderNumber}`}
                      className="font-mono font-semibold text-navy-950 hover:text-gold-600"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.placedAt.toLocaleDateString(locale)}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[order.status] ?? ""}`}
                    >
                      {t(`status.${order.status}`)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {order.items.length}
                  </td>
                  <td className="px-4 py-3 text-end font-semibold">{formatMAD(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.pages > 1 && (
        <nav className="mt-6 flex justify-center gap-1.5">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/account/orders?page=${p}`}
              className={`min-w-9 rounded-md border px-3 py-1.5 text-center text-sm ${
                p === result.page
                  ? "border-navy-950 bg-navy-950 font-semibold text-white"
                  : "text-muted-foreground hover:border-foreground"
              }`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
