import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type AppUser } from "@/lib/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function getSessionUser(): Promise<AppUser | null> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return null;
  return {
    ...user,
    role: user.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
  } as AppUser;
}

export async function getCurrentUser(): Promise<AppUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/** Server-side role check — use in every server action / API route. */
export async function requireAdmin(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN") {
    throw new ForbiddenError("Administrator access required");
  }
  if (!user.active) {
    throw new ForbiddenError("This account has been disabled");
  }
  return user;
}

/** Layout/page guard — redirects instead of throwing. */
export async function requireAdminPage(callbackPath = "/admin"): Promise<AppUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }
  if (user.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}

export async function requireUserPage(callbackPath = "/account"): Promise<AppUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }
  return user;
}
