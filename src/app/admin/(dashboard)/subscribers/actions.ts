"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { setSubscriberActive, deleteSubscriber } from "@/services/newsletter";

export async function setSubscriberActiveAction(
  id: string,
  active: boolean,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await setSubscriberActive(id, active);
    revalidatePath("/admin/subscribers");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update subscriber" };
  }
}

export async function deleteSubscriberAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await deleteSubscriber(id);
    revalidatePath("/admin/subscribers");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to delete subscriber" };
  }
}
