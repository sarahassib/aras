"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { createCoupon, updateCoupon, deleteCoupon, type CouponInput } from "@/services/coupons";
import { couponInputSchema } from "@/validation/admin";

export async function saveCouponAction(
  id: string | null,
  input: CouponInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const parsed = couponInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid coupon" };
    }
    if (id) await updateCoupon(id, parsed.data);
    else await createCoupon(parsed.data);
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to save coupon" };
  }
}

export async function deleteCouponAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await deleteCoupon(id);
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to delete coupon" };
  }
}
