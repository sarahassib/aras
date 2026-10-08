import type { NextRequest } from "next/server";
import { apiRoute, created, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { createCoupon, listCoupons } from "@/services/coupons";
import { couponInputSchema } from "@/validation/admin";

export const runtime = "nodejs";

export async function GET() {
  return apiRoute(async () => {
    await requireAdmin();
    const coupons = await listCoupons();
    return ok(coupons);
  });
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const input = await readBody(request, couponInputSchema);
    const coupon = await createCoupon(input);
    return created(coupon);
  });
}
