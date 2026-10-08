const PREFERRED_LOCALE_FALLBACK: Record<string, string> = {
  ar: "nameAr",
  en: "nameEn",
};

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function pickSlugName(
  names: { fr: string; ar?: string | null; en?: string | null },
  locale: string,
): string {
  if (locale === "en" && names.en) return names.en;
  if (locale === "fr") return names.fr;
  return names.en || names.fr;
}

export function fallbackField(locale: string): keyof typeof PREFERRED_LOCALE_FALLBACK {
  return (PREFERRED_LOCALE_FALLBACK[locale] ?? "nameEn") as keyof typeof PREFERRED_LOCALE_FALLBACK;
}
