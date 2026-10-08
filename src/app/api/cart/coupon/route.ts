import type { NextRequest } from "next/server";
import { apiRoute, enforceRateLimit, noContent, ok, readBody } from "@/lib/api";
import { getCartContext } from "@/lib/cart-context";
import { applyCoupon, removeCoupon } from "@/services/cart";
import { couponApplySchema } from "@/validation/common";
import { LOCALES, type Locale } from "@/lib/business-rules";

export const runtime = "nodejs";

function resolveLocale(request: NextRequest): Locale {
  const locale = request.nextUrl.searchParams.get("locale");
  return (LOCALES as readonly string[]).includes(locale ?? "")
    ? (locale as Locale)
    : "fr";
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    enforceRateLimit(request, "cart:coupon", 30, 60_000);
    const input = await readBody(request, couponApplySchema);
    const context = await getCartContext();
    const result = await applyCoupon(context, input.code, resolveLocale(request));
    if (!result.valid) {
      return ok(result, { status: 422 });
    }
    return ok(result);
  });
}

export async function DELETE(request: NextRequest) {
  return apiRoute(async () => {
    enforceRateLimit(request, "cart:coupon", 30, 60_000);
    const context = await getCartContext();
    await removeCoupon(context);
    return noContent();
  });
}
