"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { changeOrderStatus, resendOrderEmail, updateOrderNotes } from "@/services/orders";
import type { OrderStatus } from "@/lib/business-rules";

export async function changeStatusAction(
  orderId: string,
  toStatus: OrderStatus,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();
    await changeOrderStatus(orderId, toStatus, { id: admin.id, name: admin.name });
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update status" };
  }
}

export async function saveNotesAction(
  orderId: string,
  notes: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await updateOrderNotes(orderId, notes.trim() ? notes.trim() : null);
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to save notes" };
  }
}

export async function resendEmailAction(
  orderId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await resendOrderEmail(orderId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to queue email" };
  }
}
