import { db } from "@/lib/db";
import type { OrderStatus, PaymentStatus } from "@/lib/business-rules";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/business-rules";

export interface DashboardStats {
  totalSalesMinor: number;
  totalOrders: number;
  totalCustomers: number;
  activeProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  orderCountsByStatus: Record<OrderStatus, number>;
  paymentCountsByStatus: Record<PaymentStatus, number>;
  salesOverview: { date: string; salesMinor: number; orders: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    fullName: string;
    totalMinor: number;
    status: OrderStatus;
    placedAt: Date;
  }[];
  topProducts: { id: string; name: string; salesCount: number; rating: number }[];
  lowStock: { id: string; name: string; stock: number }[];
}

const SALES_WINDOW_DAYS = 30;

export async function getDashboardStats(): Promise<DashboardStats> {
  const since = new Date();
  since.setDate(since.getDate() - SALES_WINDOW_DAYS);
  since.setHours(0, 0, 0, 0);

  const [
    deliveredAgg,
    totalOrders,
    totalCustomers,
    activeProducts,
    pendingOrders,
    lowStockProducts,
    orders,
    salesOrders,
    topProducts,
    lowStock,
  ] = await Promise.all([
    db.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
      _count: true,
    }),
    db.order.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.order.count({ where: { status: { in: ["NEW", "CONFIRMED"] } } }),
    db.product.count({ where: { status: "ACTIVE", stock: { lte: 5 } } }),
    db.order.findMany({ select: { status: true, paymentStatus: true } }),
    db.order.findMany({
      where: { createdAt: { gte: since } },
      select: { total: true, createdAt: true },
    }),
    db.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { salesCount: "desc" },
      take: 5,
      select: { id: true, nameFr: true, salesCount: true, rating: true },
    }),
    db.product.findMany({
      where: { status: "ACTIVE", stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 8,
      select: { id: true, nameFr: true, stock: true },
    }),
  ]);

  const orderCountsByStatus = Object.fromEntries(
    ORDER_STATUSES.map((status) => [status, 0]),
  ) as Record<OrderStatus, number>;
  const paymentCountsByStatus = Object.fromEntries(
    PAYMENT_STATUSES.map((status) => [status, 0]),
  ) as Record<PaymentStatus, number>;

  for (const order of orders) {
    orderCountsByStatus[order.status] += 1;
    paymentCountsByStatus[order.paymentStatus] += 1;
  }

  // Daily buckets for the last N days (paid revenue only).
  const buckets = new Map<string, { salesMinor: number; orders: number }>();
  for (let i = SALES_WINDOW_DAYS - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    buckets.set(date.toISOString().slice(0, 10), { salesMinor: 0, orders: 0 });
  }
  for (const order of salesOrders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.salesMinor += order.total;
      bucket.orders += 1;
    }
  }

  const recent = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      orderNumber: true,
      fullName: true,
      total: true,
      status: true,
      placedAt: true,
    },
  });

  return {
    totalSalesMinor: deliveredAgg._sum.total ?? 0,
    totalOrders,
    totalCustomers,
    activeProducts,
    pendingOrders,
    lowStockProducts,
    orderCountsByStatus,
    paymentCountsByStatus,
    salesOverview: [...buckets.entries()].map(([date, value]) => ({
      date,
      salesMinor: value.salesMinor,
      orders: value.orders,
    })),
    recentOrders: recent.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      fullName: order.fullName,
      totalMinor: order.total,
      status: order.status,
      placedAt: order.placedAt,
    })),
    topProducts: topProducts.map((product) => ({
      id: product.id,
      name: product.nameFr,
      salesCount: product.salesCount,
      rating: product.rating,
    })),
    lowStock: lowStock.map((product) => ({
      id: product.id,
      name: product.nameFr,
      stock: product.stock,
    })),
  };
}
