import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardStats } from "@/services/stats";
import { formatMAD } from "@/lib/money";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { SalesChart } from "@/components/admin/sales-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingCart, Users, Package, AlertTriangle, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const kpis = [
    { label: "Paid revenue", value: formatMAD(stats.totalSalesMinor), icon: TrendingUp, hint: "all time" },
    { label: "Orders", value: String(stats.totalOrders), icon: ShoppingCart, hint: `${stats.pendingOrders} awaiting action` },
    { label: "Customers", value: String(stats.totalCustomers), icon: Users, hint: "registered" },
    { label: "Active products", value: String(stats.activeProducts), icon: Package, hint: `${stats.lowStockProducts} low stock` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-950">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Last 30 days</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                  <span className="flex size-9 items-center justify-center rounded-lg bg-navy-950/5 text-navy-900">
                    <Icon className="size-4" />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-navy-950">{kpi.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales overview</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={stats.salesOverview} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.orderCountsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <OrderStatusBadge status={status} />
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
            {stats.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy-950">{order.orderNumber}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {order.fullName} · {order.placedAt.toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-sm font-semibold">{formatMAD(order.totalMinor)}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-4 text-gold-600" /> Top products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">
                    <span className="me-2 text-muted-foreground">{index + 1}.</span>
                    {product.name}
                  </span>
                  <span className="shrink-0 font-semibold">{product.salesCount} sold</span>
                </div>
              ))}
              {stats.topProducts.length === 0 && (
                <p className="text-sm text-muted-foreground">No sales yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600" /> Low stock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.lowStock.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{product.name}</span>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {product.stock} left
                  </span>
                </div>
              ))}
              {stats.lowStock.length === 0 && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" /> Stock levels are healthy.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
