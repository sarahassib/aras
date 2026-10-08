"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import {
  createPromotion,
  updatePromotion,
  deletePromotion,
  type PromotionInput,
} from "@/services/promotions";
import { promotionInputSchema } from "@/validation/admin";

export async function savePromotionAction(
  id: string | null,
  input: PromotionInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const parsed = promotionInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid promotion" };
    }
    if (id) await updatePromotion(id, parsed.data);
    else await createPromotion(parsed.data);
    revalidatePath("/admin/promotions");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to save promotion" };
  }
}

export async function deletePromotionAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await deletePromotion(id);
    revalidatePath("/admin/promotions");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to delete promotion" };
  }
}
