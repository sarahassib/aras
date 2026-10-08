import { db } from "@/lib/db";
import { isFreeShipping } from "@/lib/business-rules";

export interface DeliveryQuote {
  city: string;
  feeMinor: number;
  zoneFeeMinor: number;
  freeShippingApplied: boolean;
  thresholdMinor: number;
  thresholdRemainingMinor: number;
  zoneFound: boolean;
}

export interface DeliveryZoneDTO {
  id: string;
  city: string;
  feeMinor: number;
  active: boolean;
  isDefault: boolean;
  sortOrder: number;
}

interface SettingsLike {
  freeShippingThreshold: number;
}

async function getThreshold(): Promise<number> {
  const settings = await db.storeSetting.findFirst({
    select: { freeShippingThreshold: true },
  });
  return settings?.freeShippingThreshold ?? 0;
}

/**
 * Delivery fee for a city:
 *  - free when the order total reaches the configured threshold (default 500 DH)
 *  - otherwise the active zone fee for that city (falling back to the default zone)
 */
export async function getDeliveryQuote(
  subtotalMinor: number,
  city: string,
): Promise<DeliveryQuote> {
  const threshold = await getThreshold();
  const trimmedCity = city.trim();

  const [zone, defaultZone] = await Promise.all([
    db.deliveryZone.findFirst({
      where: { active: true, city: { equals: trimmedCity, mode: "insensitive" } },
    }),
    db.deliveryZone.findFirst({ where: { active: true, isDefault: true } }),
  ]);

  const matched = zone ?? defaultZone ?? null;
  const zoneFeeMinor = matched ? matched.fee : 0;

  const freeShippingApplied = isFreeShipping(subtotalMinor, threshold);
  const fee = freeShippingApplied ? 0 : zoneFeeMinor;

  return {
    city: trimmedCity,
    feeMinor: fee,
    zoneFeeMinor,
    freeShippingApplied,
    thresholdMinor: threshold,
    thresholdRemainingMinor: Math.max(0, threshold - subtotalMinor),
    zoneFound: !!zone,
  };
}

export async function listDeliveryZones(): Promise<DeliveryZoneDTO[]> {
  const zones = await db.deliveryZone.findMany({ orderBy: [{ sortOrder: "asc" }, { city: "asc" }] });
  return zones.map((zone) => ({
    id: zone.id,
    city: zone.city,
    feeMinor: zone.fee,
    active: zone.active,
    isDefault: zone.isDefault,
    sortOrder: zone.sortOrder,
  }));
}

export interface DeliveryZoneInput {
  city: string;
  feeMinor: number;
  active?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
}

export async function upsertDeliveryZone(
  input: DeliveryZoneInput,
): Promise<DeliveryZoneDTO> {
  const data = {
    city: input.city.trim(),
    fee: input.feeMinor,
    active: input.active ?? true,
    isDefault: input.isDefault ?? false,
    sortOrder: input.sortOrder ?? 0,
  };

  if (data.isDefault) {
    await db.deliveryZone.updateMany({ data: { isDefault: false } });
  }

  const zone = await db.deliveryZone.upsert({
    where: { city: data.city },
    create: data,
    update: {
      fee: data.fee,
      active: data.active,
      isDefault: data.isDefault,
      sortOrder: data.sortOrder,
    },
  });

  return {
    id: zone.id,
    city: zone.city,
    feeMinor: zone.fee,
    active: zone.active,
    isDefault: zone.isDefault,
    sortOrder: zone.sortOrder,
  };
}

export async function updateDeliveryZone(
  id: string,
  input: DeliveryZoneInput,
): Promise<DeliveryZoneDTO> {
  const existing = await db.deliveryZone.findUnique({ where: { id } });
  if (!existing) throw new Error("Delivery zone not found");

  if (input.isDefault) {
    await db.deliveryZone.updateMany({ data: { isDefault: false }, where: { NOT: { id } } });
  }

  const city = input.city.trim();
  const clash = await db.deliveryZone.findFirst({ where: { city, NOT: { id } } });
  if (clash) throw new Error(`A zone for "${city}" already exists`);

  const zone = await db.deliveryZone.update({
    where: { id },
    data: {
      city,
      fee: input.feeMinor,
      active: input.active ?? existing.active,
      isDefault: input.isDefault ?? existing.isDefault,
      sortOrder: input.sortOrder ?? existing.sortOrder,
    },
  });

  return {
    id: zone.id,
    city: zone.city,
    feeMinor: zone.fee,
    active: zone.active,
    isDefault: zone.isDefault,
    sortOrder: zone.sortOrder,
  };
}

export async function deleteDeliveryZone(id: string): Promise<void> {
  const zone = await db.deliveryZone.findUnique({ where: { id } });
  if (!zone) return;
  if (zone.isDefault) {
    throw new Error("Cannot delete the default delivery zone");
  }
  await db.deliveryZone.delete({ where: { id } });
}
