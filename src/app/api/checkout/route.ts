import type { NextRequest } from "next/server";
import { apiRoute, enforceRateLimit, ok, readBody } from "@/lib/api";
import { getCartContext } from "@/lib/cart-context";
import { getSessionUser } from "@/lib/session";
import { getCheckoutSnapshot } from "@/services/cart";
import { createOrder } from "@/services/orders";
import { getSettings } from "@/services/settings";
import { ValidationError } from "@/lib/errors";
import { checkoutSchema } from "@/validation/common";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    enforceRateLimit(request, "checkout", 10, 60_000);

    const input = await readBody(request, checkoutSchema);
    const user = await getSessionUser();
    const context = await getCartContext();
    const snapshot = await getCheckoutSnapshot(context);

    const settings = await getSettings(input.locale);
    if (input.paymentMethod === "COD" && !settings.codEnabled) {
      throw new ValidationError("Cash on delivery is not available", [
        { path: "paymentMethod", message: "COD disabled" },
      ]);
    }
    if (input.paymentMethod === "CARD" && !settings.cardEnabled) {
      throw new ValidationError("Card payment is not available", [
        { path: "paymentMethod", message: "Card disabled" },
      ]);
    }

    const result = await createOrder({
      userId: user?.id ?? null,
      email: input.email || user?.email || null,
      fullName: input.fullName,
      phone: input.phone,
      city: input.city,
      addressLine: input.addressLine,
      customerNote: input.customerNote ?? null,
      paymentMethod: input.paymentMethod,
      couponCode: input.couponCode || snapshot.cart.couponCode || null,
      items: snapshot.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      locale: input.locale,
      cartId: snapshot.cart.id,
    });

    return ok(result);
  });
}
