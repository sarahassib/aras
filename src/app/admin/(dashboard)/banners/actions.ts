"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { createBanner, updateBanner, deleteBanner, type BannerInput } from "@/services/banners";

export async function saveBannerAction(
  id: string | null,
  input: BannerInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (id) await updateBanner(id, input);
    else await createBanner(input);
    revalidatePath("/admin/banners");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to save banner" };
  }
}

export async function deleteBannerAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await deleteBanner(id);
    revalidatePath("/admin/banners");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to delete banner" };
  }
}
