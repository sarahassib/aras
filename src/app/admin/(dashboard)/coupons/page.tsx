import type { Metadata } from "next";
import Link from "next/link";
import { listCoupons } from "@/services/coupons";
import { formatMAD } from "@/lib/money";
import { ActiveBadge, Badge } from "@/components/admin/status-badge";
import { CouponRowActions } from "@/components/admin/coupon-row-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Coupons" };

function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}

export default async function AdminCouponsPage() {
  const coupons = await listCoupons();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Coupons</h1>
          <p className="text-sm text-muted-foreground">{coupons.length} discount codes</p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-navy-950 px-4 text-sm font-semibold text-white hover:bg-navy-800"
        >
          <Plus className="size-4" /> New coupon
        </Link>
      </div>

      <div className="rounded-xl border bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-end">Value</TableHead>
              <TableHead className="text-end">Min order</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No coupons yet.
                </TableCell>
              </TableRow>
            )}
            {coupons.map((coupon) => {
              const expired = coupon.expiresAt ? isExpired(coupon.expiresAt) : false;

              return (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <Link
                      href={`/admin/coupons/${coupon.id}`}
                      className="font-mono text-sm font-semibold text-navy-950 hover:text-gold-600"
                    >
                      {coupon.code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        coupon.type === "PERCENT"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-violet-100 text-violet-800"
                      }
                    >
                      {coupon.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end font-semibold">
                    {coupon.type === "PERCENT" ? `${coupon.value}%` : formatMAD(coupon.value)}
                  </TableCell>
                  <TableCell className="text-end text-sm">
                    {coupon.minOrderAmountMinor === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      formatMAD(coupon.minOrderAmountMinor)
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {coupon.usedCount} used
                    {coupon.maxUses !== null ? ` of ${coupon.maxUses}` : ""}
                  </TableCell>
                  <TableCell>
                    <ActiveBadge active={coupon.active} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {coupon.expiresAt ? (
                      <span
                        className={
                          expired ? "font-medium text-red-600" : "text-muted-foreground"
                        }
                      >
                        {coupon.expiresAt.toLocaleDateString("en-GB")}
                        {expired ? " · expired" : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <CouponRowActions coupon={coupon} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
