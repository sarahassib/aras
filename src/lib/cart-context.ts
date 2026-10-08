import "server-only";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/session";
import {
  GUEST_CART_COOKIE,
  generateCartToken,
  mergeGuestCart,
  type CartContext,
} from "@/services/cart";

const CART_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Resolves the cart identity for the current request:
 *  - signed-in user → their cart (guest cart from before login is merged in)
 *  - guest → token cart, minting + setting the cookie on first use
 */
export async function getCartContext(): Promise<CartContext> {
  const [user, store] = await Promise.all([getSessionUser(), cookies()]);
  const token = store.get(GUEST_CART_COOKIE)?.value ?? null;

  if (user) {
    if (token) {
      await mergeGuestCart(token, user.id).catch((error) =>
        console.error("[cart] guest merge failed:", error),
      );
    }
    return { userId: user.id };
  }

  if (token) return { token };

  const newToken = generateCartToken();
  store.set(GUEST_CART_COOKIE, newToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_MAX_AGE,
  });
  return { token: newToken };
}

export async function clearCartCookie(): Promise<void> {
  const store = await cookies();
  store.delete(GUEST_CART_COOKIE);
}
