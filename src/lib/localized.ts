import type { Locale } from "@/lib/business-rules";

export interface LocalizedStringFields {
  nameFr: string;
  nameAr: string;
  nameEn: string;
}

export interface LocalizedDescriptionFields {
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
}

/** Picks the localized variant, falling back gracefully when empty. */
export function pickLocale(
  fields: { fr: string; ar?: string | null; en?: string | null },
  locale: Locale,
): string {
  if (locale === "ar") return fields.ar || fields.en || fields.fr;
  if (locale === "en") return fields.en || fields.fr;
  return fields.fr;
}

export function localizedName(
  record: Partial<LocalizedStringFields> & { nameFr: string },
  locale: Locale,
): string {
  return pickLocale(
    { fr: record.nameFr, ar: record.nameAr, en: record.nameEn },
    locale,
  );
}

export function localizedDescription(
  record: LocalizedDescriptionFields & { descriptionFr?: string | null },
  locale: Locale,
): string {
  const value = pickLocale(
    {
      fr: record.descriptionFr ?? "",
      ar: record.descriptionAr,
      en: record.descriptionEn,
    },
    locale,
  );
  if (value) return value;
  return record.descriptionFr ?? "";
}
