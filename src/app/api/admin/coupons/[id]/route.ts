import type { NextRequest } from "next/server";
import { apiRoute, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { deleteCoupon, updateCoupon } from "@/services/coupons";
import { couponInputSchema } from "@/validation/admin";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const input = await readBody(request, couponInputSchema.partial());
    const coupon = await updateCoupon(id, input);
    return ok(coupon);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    await deleteCoupon(id);
    return ok({ ok: true });
  });
}
