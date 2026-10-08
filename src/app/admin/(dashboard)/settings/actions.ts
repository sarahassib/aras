"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { updateSettings, type SettingsInput } from "@/services/settings";
import { parseAmountToMinor } from "@/lib/money";

export async function saveSettingsAction(
  input: SettingsInput & { freeShippingThreshold?: string },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();

    const payload: SettingsInput = { ...input };
    if (input.freeShippingThreshold !== undefined) {
      payload.freeShippingThresholdMinor = parseAmountToMinor(input.freeShippingThreshold);
    }
    delete (payload as { freeShippingThreshold?: string }).freeShippingThreshold;

    await updateSettings(payload);
    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to save settings" };
  }
}
