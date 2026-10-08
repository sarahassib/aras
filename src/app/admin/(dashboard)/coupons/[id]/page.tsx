import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listCoupons } from "@/services/coupons";
import { CouponForm } from "@/components/admin/coupon-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Edit coupon" };

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coupons = await listCoupons();
  const coupon = coupons.find((item) => item.id === id);
  if (!coupon) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/coupons"
          className="flex size-9 items-center justify-center rounded-md border bg-white hover:bg-muted"
          aria-label="Back to coupons"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Edit coupon</h1>
          <p className="font-mono text-sm text-muted-foreground">{coupon.code}</p>
        </div>
      </div>

      <CouponForm coupon={coupon} />
    </div>
  );
}
