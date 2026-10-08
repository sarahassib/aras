"use client";

import Link from "next/link";
import { deleteCouponAction } from "@/app/admin/(dashboard)/coupons/actions";
import { DeleteConfirmButton } from "@/components/admin/delete-confirm-button";
import type { CouponDTO } from "@/services/coupons";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export function CouponRowActions({ coupon }: { coupon: CouponDTO }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        asChild
        variant="outline"
        size="icon"
        className="size-8"
        aria-label={`Edit coupon ${coupon.code}`}
      >
        <Link href={`/admin/coupons/${coupon.id}`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
      <DeleteConfirmButton
        message={`Delete the coupon “${coupon.code}”? This cannot be undone.`}
        successMessage="Coupon deleted"
        onConfirm={() => deleteCouponAction(coupon.id)}
      />
    </div>
  );
}
