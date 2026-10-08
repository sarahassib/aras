import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { MIN_PASSWORD_LENGTH } from "@/lib/business-rules";
import {
  enqueuePasswordResetEmail,
  enqueueWelcomeEmail,
} from "@/services/email/outbox";

export const auth = betterAuth({
  appName: "ARAS",
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ""].filter(Boolean),
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    requireEmailVerification: false,
    resetPassword: {
      sendResetPassword: async (data: {
        user: { email: string; name: string };
        url: string;
      }) => {
        await enqueuePasswordResetEmail(data.user.email, data.user.name, data.url);
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await enqueueWelcomeEmail(user.email, user.name);
          } catch (error) {
            console.error("[auth] welcome email failed:", error);
          }
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    rules: [
      { pathMatcher: "^/sign-in$", window: 60, max: 5 },
      { pathMatcher: "^/forget-password$", window: 60, max: 3 },
      { pathMatcher: "^/reset-password$", window: 60, max: 5 },
      { pathMatcher: "^/sign-up$", window: 60, max: 5 },
    ],
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CUSTOMER",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      active: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

export type SessionRole = "CUSTOMER" | "ADMIN";

export interface AppUser extends Omit<Session["user"], "role"> {
  role: SessionRole;
}
