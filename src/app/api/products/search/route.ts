import type { NextRequest } from "next/server";
import { apiRoute, enforceRateLimit, ok } from "@/lib/api";
import { searchSuggestions } from "@/services/products";
import { LOCALES, type Locale } from "@/lib/business-rules";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    enforceRateLimit(request, "search", 60, 60_000);

    const q = request.nextUrl.searchParams.get("q") ?? "";
    const localeParam = request.nextUrl.searchParams.get("locale") ?? "fr";
    const locale = (LOCALES as readonly string[]).includes(localeParam)
      ? (localeParam as Locale)
      : "fr";

    const items = await searchSuggestions(q, locale, 8);
    return ok({ items });
  });
}
