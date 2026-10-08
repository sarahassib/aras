import { Badge } from "@/components/ui/badge";

const ORDER_STYLES: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800",
  PREPARING: "bg-amber-100 text-amber-800",
  SHIPPED: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const PAYMENT_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-slate-200 text-slate-700",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ORDER_STYLES[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${PAYMENT_STYLES[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export { Badge };
