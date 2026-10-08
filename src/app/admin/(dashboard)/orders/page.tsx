import type { Metadata } from "next";
import Link from "next/link";
import { listOrdersAdmin } from "@/services/orders";
import { formatMAD } from "@/lib/money";
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "@/lib/business-rules";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payment?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const result = await listOrdersAdmin({
    status: ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined,
    paymentStatus: PAYMENT_STATUSES.includes(sp.payment as PaymentStatus)
      ? (sp.payment as PaymentStatus)
      : undefined,
    q: sp.q,
    page,
    perPage: 20,
  });

  const qs = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { status: sp.status, payment: sp.payment, q: sp.q, page: sp.page, ...next };
    for (const [key, value] of Object.entries(merged)) {
      if (value && !(key === "page" && value === "1")) params.set(key, value);
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Orders</h1>
          <p className="text-sm text-muted-foreground">{result.total} total orders</p>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3" action="/admin/orders" method="get">
        <div className="min-w-56 flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Search</label>
          <Input name="q" defaultValue={sp.q ?? ""} placeholder="Order number, name, phone, email" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment</label>
          <select
            name="payment"
            defaultValue={sp.payment ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All payments</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-9 rounded-md bg-navy-950 px-4 text-sm font-semibold text-white hover:bg-navy-800"
        >
          Filter
        </button>
        {(sp.q || sp.status || sp.payment) && (
          <Link href="/admin/orders" className="h-9 px-2 text-sm text-muted-foreground hover:text-foreground">
            Clear
          </Link>
        )}
      </form>

      <div className="rounded-xl border bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No orders match these filters.
                </TableCell>
              </TableRow>
            )}
            {result.items.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-mono text-sm font-semibold text-navy-950 hover:text-gold-600"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{order.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.city} · {order.phone}
                  </p>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {order.placedAt.toLocaleDateString("en-GB")}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{order.paymentMethod}</span>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-end font-semibold">{formatMAD(order.totalMinor)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {result.pages > 1 && (
        <nav className="flex justify-center gap-1.5">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={qs({ page: String(p) })}
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
