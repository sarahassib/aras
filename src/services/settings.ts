import { db } from "@/lib/db";
import { DEFAULT_FREE_SHIPPING_THRESHOLD } from "@/lib/business-rules";

export interface StoreSettingsDTO {
  id: string;
  storeName: string;
  logoUrl: string | null;
  contactEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  currency: string;
  freeShippingThresholdMinor: number;
  codEnabled: boolean;
  cardEnabled: boolean;
  paymentInstructions: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  social: {
    facebook: string | null;
    instagram: string | null;
    tiktok: string | null;
    youtube: string | null;
  };
  announcement: { fr: string | null; ar: string | null; en: string | null };
}

interface RawSettings {
  id: string;
  storeName: string;
  logoUrl: string | null;
  contactEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  currency: string;
  freeShippingThreshold: number;
  codEnabled: boolean;
  cardEnabled: boolean;
  paymentInstructionsFr: string | null;
  paymentInstructionsAr: string | null;
  paymentInstructionsEn: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  announcementFr: string | null;
  announcementAr: string | null;
  announcementEn: string | null;
}

function toDTO(raw: RawSettings, locale: string): StoreSettingsDTO {
  const instructions =
    locale === "ar"
      ? raw.paymentInstructionsAr || raw.paymentInstructionsFr
      : locale === "en"
        ? raw.paymentInstructionsEn || raw.paymentInstructionsFr
        : raw.paymentInstructionsFr;

  return {
    id: raw.id,
    storeName: raw.storeName,
    logoUrl: raw.logoUrl,
    contactEmail: raw.contactEmail,
    phone: raw.phone,
    whatsapp: raw.whatsapp,
    address: raw.address,
    currency: raw.currency,
    freeShippingThresholdMinor: raw.freeShippingThreshold,
    codEnabled: raw.codEnabled,
    cardEnabled: raw.cardEnabled,
    paymentInstructions: instructions,
    metaTitle: raw.metaTitle,
    metaDescription: raw.metaDescription,
    social: {
      facebook: raw.facebookUrl,
      instagram: raw.instagramUrl,
      tiktok: raw.tiktokUrl,
      youtube: raw.youtubeUrl,
    },
    announcement: {
      fr: raw.announcementFr,
      ar: raw.announcementAr,
      en: raw.announcementEn,
    },
  };
}

const CACHE_TTL_MS = 10_000;
let cache: { data: RawSettings; at: number } | null = null;

export function invalidateSettingsCache(): void {
  cache = null;
}

export async function getRawSettings(): Promise<RawSettings> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

  let settings = await db.storeSetting.findFirst();

  if (!settings) {
    settings = await db.storeSetting.create({
      data: { freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD },
    });
  }

  const raw = settings as unknown as RawSettings;
  cache = { data: raw, at: Date.now() };
  return raw;
}

export async function getSettings(locale = "fr"): Promise<StoreSettingsDTO> {
  const raw = await getRawSettings();
  return toDTO(raw, locale);
}

export interface SettingsInput {
  storeName?: string;
  logoUrl?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  currency?: string;
  freeShippingThresholdMinor?: number;
  codEnabled?: boolean;
  cardEnabled?: boolean;
  paymentInstructionsFr?: string | null;
  paymentInstructionsAr?: string | null;
  paymentInstructionsEn?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  announcementFr?: string | null;
  announcementAr?: string | null;
  announcementEn?: string | null;
}

export async function updateSettings(input: SettingsInput): Promise<void> {
  const data: Record<string, unknown> = {};

  const scalarKeys = [
    "storeName",
    "logoUrl",
    "contactEmail",
    "phone",
    "whatsapp",
    "address",
    "currency",
    "codEnabled",
    "cardEnabled",
    "paymentInstructionsFr",
    "paymentInstructionsAr",
    "paymentInstructionsEn",
    "metaTitle",
    "metaDescription",
    "facebookUrl",
    "instagramUrl",
    "tiktokUrl",
    "youtubeUrl",
    "announcementFr",
    "announcementAr",
    "announcementEn",
  ] as const;

  for (const key of scalarKeys) {
    if (input[key] !== undefined) data[key] = input[key];
  }

  if (input.freeShippingThresholdMinor !== undefined) {
    data.freeShippingThreshold = input.freeShippingThresholdMinor;
  }

  const existing = await db.storeSetting.findFirst();

  if (existing) {
    await db.storeSetting.update({ where: { id: existing.id }, data });
  } else {
    await db.storeSetting.create({
      data: {
        ...(data as object),
        freeShippingThreshold:
          input.freeShippingThresholdMinor ?? DEFAULT_FREE_SHIPPING_THRESHOLD,
      },
    });
  }

  invalidateSettingsCache();
}
