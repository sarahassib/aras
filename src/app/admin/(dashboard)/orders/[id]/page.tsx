import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderAdmin } from "@/services/orders";
import { formatMAD } from "@/lib/money";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badge";
import { OrderDetailActions } from "@/components/admin/order-detail-actions";
import { NotFoundError } from "@/lib/errors";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Mail, Phone, MapPin, User, Truck } from "lucide-react";

export const metadata: Metadata = { title: "Order detail" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let order;
  try {
    order = await getOrderAdmin(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="flex size-9 items-center justify-center rounded-md border bg-white hover:bg-muted"
            aria-label="Back to orders"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="font-mono text-xl font-bold text-navy-950">{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Placed {order.placedAt.toLocaleString("en-GB")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <div className="rounded-xl border bg-white shadow-xs">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-semibold text-navy-950">Items</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead className="text-end">Unit</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-end">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.productName}</p>
                      <p className="font-mono text-xs text-muted-foreground">{item.sku}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.variantLabel ?? "—"}
                    </TableCell>
                    <TableCell className="text-end text-sm">{formatMAD(item.unitPrice)}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-end font-semibold">{formatMAD(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="space-y-1.5 border-t px-4 py-4 text-sm">
              <Row label="Subtotal" value={formatMAD(order.subtotal)} />
              {order.discountAmount > 0 && (
                <Row
                  label={`Discount${order.coupon ? ` (${order.coupon.code})` : ""}`}
                  value={`− ${formatMAD(order.discountAmount)}`}
                />
              )}
              <Row
                label="Delivery"
                value={order.deliveryFee === 0 ? "Free" : formatMAD(order.deliveryFee)}
              />
              <div className="flex justify-between border-t pt-2 text-base font-bold text-navy-950">
                <span>Total</span>
                <span>{formatMAD(order.total)}</span>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="rounded-xl border bg-white p-4 shadow-xs">
            <h2 className="mb-4 text-sm font-semibold text-navy-950">Status history</h2>
            <ol className="space-y-4">
              {order.history.map((entry) => (
                <li key={entry.id} className="flex gap-3 text-sm">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-gold-500" />
                  <div>
                    <p className="font-medium">
                      {entry.fromStatus} → {entry.toStatus}
                      <span className="ms-2 text-xs font-normal text-muted-foreground">
                        {entry.createdAt.toLocaleString("en-GB")}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {entry.actorName ?? "system"}
                      {entry.note ? ` — ${entry.note}` : ""}
                    </p>
                  </div>
                </li>
              ))}
              {order.history.length === 0 && (
                <li className="text-sm text-muted-foreground">No history yet.</li>
              )}
            </ol>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <OrderDetailActions
            orderId={order.id}
            currentStatus={order.status}
            initialNotes={order.adminNotes}
          />

          <div className="rounded-xl border bg-white p-4 shadow-xs">
            <h2 className="mb-3 text-sm font-semibold text-navy-950">Customer</h2>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <User className="size-4 text-gold-600" /> {order.fullName}
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-gold-600" /> {order.phone}
              </li>
              {order.email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="size-4 text-gold-600" /> {order.email}
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold-600" />
                <span>
                  {order.addressLine}
                  <br />
                  {order.city}
                </span>
              </li>
              {order.customerNote && (
                <li className="rounded-lg bg-muted/60 p-2.5 text-muted-foreground">
                  “{order.customerNote}”
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-xs">
            <h2 className="mb-3 text-sm font-semibold text-navy-950">Payment</h2>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <Truck className="size-4 text-gold-600" /> {order.paymentMethod}
              </li>
              <li>
                Status: <PaymentStatusBadge status={order.paymentStatus} />
              </li>
              {order.payment && (
                <li className="text-xs text-muted-foreground">
                  Updated {order.payment.updatedAt.toLocaleString("en-GB")}
                  {order.payment.providerReference && (
                    <>
                      <br />
                      Ref: <span className="font-mono">{order.payment.providerReference}</span>
                    </>
                  )}
                </li>
              )}
            </ul>
          </div>

          {order.user && (
            <div className="rounded-xl border bg-white p-4 shadow-xs">
              <h2 className="mb-2 text-sm font-semibold text-navy-950">Account</h2>
              <p className="text-sm text-muted-foreground">
                {order.user.name} · {order.user.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
