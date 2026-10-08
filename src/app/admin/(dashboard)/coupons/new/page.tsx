import type { Metadata } from "next";
import Link from "next/link";
import { CouponForm } from "@/components/admin/coupon-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "New coupon" };

export default function NewCouponPage() {
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
          <h1 className="text-2xl font-bold text-navy-950">New coupon</h1>
          <p className="text-sm text-muted-foreground">
            Create a discount code customers can apply at checkout.
          </p>
        </div>
      </div>

      <CouponForm coupon={null} />
    </div>
  );
}
