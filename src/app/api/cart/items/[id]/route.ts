import type { NextRequest } from "next/server";
import { apiRoute, enforceRateLimit, noContent, ok, readBody } from "@/lib/api";
import { getCartContext } from "@/lib/cart-context";
import { removeCartItem, updateCartItem } from "@/services/cart";
import { cartUpdateSchema } from "@/validation/common";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    enforceRateLimit(request, "cart:update", 120, 60_000);
    const { id } = await params;
    const input = await readBody(request, cartUpdateSchema);
    const context = await getCartContext();
    await updateCartItem(context, id, input.quantity);
    return ok({ ok: true });
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    enforceRateLimit(request, "cart:update", 120, 60_000);
    const { id } = await params;
    const context = await getCartContext();
    await removeCartItem(context, id);
    return noContent();
  });
}
