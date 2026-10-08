import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/business-rules";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function dirFor(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Picks the best supported locale from an Accept-Language header. */
export function pickLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const candidates = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const quality = qParam ? Number.parseFloat(qParam.split("=")[1] ?? "0") : 1;
      return { tag: (tag ?? "").trim().toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const candidate of candidates) {
    const base = candidate.tag.split("-")[0] ?? "";
    const match = LOCALES.find((locale) => locale === base || locale === candidate.tag);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

/** Locale for the current request: NEXT_LOCALE cookie → Accept-Language → default. */
export async function getCurrentLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("NEXT_LOCALE")?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const headerStore = await headers();
  return pickLocale(headerStore.get("accept-language"));
}
