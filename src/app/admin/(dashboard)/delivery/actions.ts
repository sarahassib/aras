"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { upsertDeliveryZone, updateDeliveryZone, deleteDeliveryZone, type DeliveryZoneInput } from "@/services/delivery";

export async function saveDeliveryZoneAction(
  id: string | null,
  input: DeliveryZoneInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (id) await updateDeliveryZone(id, input);
    else await upsertDeliveryZone(input);
    revalidatePath("/admin/delivery");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to save delivery zone" };
  }
}

export async function deleteDeliveryZoneAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await deleteDeliveryZone(id);
    revalidatePath("/admin/delivery");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to delete delivery zone" };
  }
}
