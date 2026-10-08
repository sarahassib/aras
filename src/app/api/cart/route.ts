import type { NextRequest } from "next/server";
import { apiRoute, ok } from "@/lib/api";
import { getCartContext } from "@/lib/cart-context";
import { getCart } from "@/services/cart";
import { LOCALES, type Locale } from "@/lib/business-rules";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    const localeParam = request.nextUrl.searchParams.get("locale") ?? "fr";
    const locale = (LOCALES as readonly string[]).includes(localeParam)
      ? (localeParam as Locale)
      : "fr";

    const context = await getCartContext();
    const cart = await getCart(context, locale);
    return ok(cart);
  });
}
