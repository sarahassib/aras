import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireUserPage } from "@/lib/session";
import { listCustomerOrders } from "@/services/orders";
import { formatMAD } from "@/lib/money";
import { SignOutButton } from "@/components/store/sign-out-button";
import { Package, MapPin, User, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Mon compte" };

const STATUS_STYLE: Record<string, string> = {
  NEW: "bg-secondary text-secondary-foreground",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-amber-100 text-amber-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  const to = await getTranslations({ locale, namespace: "order" });
  const user = await requireUserPage("/account");
  const recent = await listCustomerOrders(user.id, 1, 5);

  return (
    <div className="container-store section-spacing">
      <h1 className="heading-display text-3xl">{t("title")}</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Profile */}
        <aside className="h-fit rounded-xl border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-navy-950 text-lg font-bold text-gold-400">
              {(user.name ?? user.email ?? "A").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-navy-950">{user.name ?? "—"}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <p className="flex items-center gap-2.5 text-muted-foreground">
              <User className="size-4 text-gold-600" /> {t("profile")}
            </p>
            <Link href="/account/orders" className="flex items-center gap-2.5 hover:text-gold-600">
              <Package className="size-4 text-gold-600" /> {t("orders")}
              <ChevronRight className="ms-auto size-4" />
            </Link>
            <p className="flex items-center gap-2.5 text-muted-foreground">
              <MapPin className="size-4 text-gold-600" /> {t("addresses")}
            </p>
          </div>

          <div className="mt-6 border-t pt-5">
            <SignOutButton />
          </div>
        </aside>

        {/* Recent orders */}
        <section className="rounded-xl border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-950">{to("myOrders")}</h2>
            <Link href="/account/orders" className="text-sm font-medium text-gold-600 hover:text-gold-500">
              {to("myOrders")} →
            </Link>
          </div>

          {recent.items.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">{to("empty")}</p>
          ) : (
            <ul className="mt-5 divide-y">
              {recent.items.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/order/${order.orderNumber}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-muted/50"
                  >
                    <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[order.status] ?? ""}`}
                    >
                      {to(`status.${order.status}`)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {order.placedAt.toLocaleDateString(locale)}
                    </span>
                    <span className="ms-auto text-sm font-semibold">
                      {formatMAD(order.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
