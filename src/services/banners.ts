import { db } from "@/lib/db";
import type { Locale } from "@/lib/business-rules";
import type { BannerPlacement } from "@/generated/prisma/client";
import { localizedName, localizedDescription, pickLocale } from "@/lib/localized";
import { NotFoundError } from "@/lib/errors";

export interface BannerDTO {
  id: string;
  placement: BannerPlacement;
  image: string;
  title: string;
  description: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  sortOrder: number;
}

export async function getBanners(
  placement: BannerPlacement,
  locale: Locale = "fr",
  limit = 5,
): Promise<BannerDTO[]> {
  const now = new Date();
  const banners = await db.banner.findMany({
    where: {
      placement,
      active: true,
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { sortOrder: "asc" },
    take: limit,
  });

  return banners.map((banner) => ({
    id: banner.id,
    placement: banner.placement,
    image: banner.image,
    title: localizedName(
      { nameFr: banner.titleFr, nameAr: banner.titleAr, nameEn: banner.titleEn },
      locale,
    ),
    description: localizedDescription(
      {
        descriptionFr: banner.descriptionFr,
        descriptionAr: banner.descriptionAr,
        descriptionEn: banner.descriptionEn,
      },
      locale,
    ),
    ctaLabel: banner.ctaLabelFr
      ? pickLocale(
          { fr: banner.ctaLabelFr, ar: banner.ctaLabelAr, en: banner.ctaLabelEn },
          locale,
        )
      : null,
    ctaUrl: banner.ctaUrl,
    sortOrder: banner.sortOrder,
  }));
}

export async function listBannersAdmin() {
  return db.banner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }] });
}

export interface BannerInput {
  placement: BannerPlacement;
  image: string;
  titleFr: string;
  titleAr: string;
  titleEn: string;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  ctaLabelFr?: string | null;
  ctaLabelAr?: string | null;
  ctaLabelEn?: string | null;
  ctaUrl?: string | null;
  active?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  sortOrder?: number;
}

export async function createBanner(input: BannerInput) {
  return db.banner.create({
    data: {
      placement: input.placement,
      image: input.image,
      titleFr: input.titleFr.trim(),
      titleAr: input.titleAr.trim(),
      titleEn: input.titleEn.trim(),
      descriptionFr: input.descriptionFr ?? null,
      descriptionAr: input.descriptionAr ?? null,
      descriptionEn: input.descriptionEn ?? null,
      ctaLabelFr: input.ctaLabelFr ?? null,
      ctaLabelAr: input.ctaLabelAr ?? null,
      ctaLabelEn: input.ctaLabelEn ?? null,
      ctaUrl: input.ctaUrl ?? null,
      active: input.active ?? true,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updateBanner(id: string, input: Partial<BannerInput>) {
  const banner = await db.banner.findUnique({ where: { id } });
  if (!banner) throw new NotFoundError("Banner not found");

  const data: Record<string, unknown> = {};
  const keys = [
    "placement", "image", "titleFr", "titleAr", "titleEn",
    "descriptionFr", "descriptionAr", "descriptionEn",
    "ctaLabelFr", "ctaLabelAr", "ctaLabelEn", "ctaUrl",
    "active", "startsAt", "endsAt", "sortOrder",
  ] as const;
  for (const key of keys) {
    if (input[key] !== undefined) data[key] = input[key];
  }

  return db.banner.update({ where: { id }, data });
}

export async function deleteBanner(id: string): Promise<void> {
  const banner = await db.banner.findUnique({ where: { id } });
  if (!banner) throw new NotFoundError("Banner not found");
  await db.banner.delete({ where: { id } });
}
