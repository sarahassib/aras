import { db } from "@/lib/db";
import type { PromotionTarget } from "@/generated/prisma/client";
import { NotFoundError } from "@/lib/errors";

export interface PromotionInput {
  name: string;
  type: PromotionTarget;
  targetId: string;
  percent: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  active?: boolean;
  sortOrder?: number;
}

export async function listPromotions() {
  return db.promotion.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
}

export async function getPromotion(id: string) {
  const promotion = await db.promotion.findUnique({ where: { id } });
  if (!promotion) throw new NotFoundError("Promotion not found");
  return promotion;
}

export async function createPromotion(input: PromotionInput) {
  return db.promotion.create({
    data: {
      name: input.name.trim(),
      type: input.type,
      targetId: input.targetId,
      percent: input.percent,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      active: input.active ?? true,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updatePromotion(id: string, input: Partial<PromotionInput>) {
  await getPromotion(id);

  return db.promotion.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.targetId !== undefined ? { targetId: input.targetId } : {}),
      ...(input.percent !== undefined ? { percent: input.percent } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });
}

export async function deletePromotion(id: string): Promise<void> {
  await getPromotion(id);
  await db.promotion.delete({ where: { id } });
}
