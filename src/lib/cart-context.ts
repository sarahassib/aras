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
 *
 * Pass `{ mint: false }` when reading from a server component (cookies can only
 * be written from a route handler / server action); an unknown guest then gets
 * an anonymous context instead of a thrown error.
 */
export async function getCartContext(options: { mint?: boolean } = {}): Promise<CartContext> {
  const { mint = true } = options;
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
  if (!mint) return {};

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
