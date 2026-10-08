import type { NextRequest } from "next/server";
import { apiRoute, created, enforceRateLimit, readBody } from "@/lib/api";
import { getCartContext } from "@/lib/cart-context";
import { addCartItem } from "@/services/cart";
import { cartAddSchema } from "@/validation/common";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    enforceRateLimit(request, "cart:add", 120, 60_000);
    const input = await readBody(request, cartAddSchema);
    const context = await getCartContext();
    await addCartItem(context, input);
    return created({ ok: true });
  });
}
