import type { NextRequest } from "next/server";
import { apiRoute, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { getSettings, updateSettings } from "@/services/settings";
import { settingsInputSchema } from "@/validation/admin";
import { LOCALES, type Locale } from "@/lib/business-rules";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const localeParam = request.nextUrl.searchParams.get("locale") ?? "fr";
    const locale = (LOCALES as readonly string[]).includes(localeParam)
      ? (localeParam as Locale)
      : "fr";
    const settings = await getSettings(locale);
    return ok(settings);
  });
}

export async function PATCH(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const input = await readBody(request, settingsInputSchema);
    await updateSettings(input);
    const settings = await getSettings("fr");
    return ok(settings);
  });
}
