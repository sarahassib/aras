import type { NextRequest } from "next/server";
import { apiRoute, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { getOrderAdmin, updateOrderNotes } from "@/services/orders";
import { orderNotesSchema } from "@/validation/admin";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const order = await getOrderAdmin(id);
    return ok(order);
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const input = await readBody(request, orderNotesSchema);
    await updateOrderNotes(id, input.adminNotes ?? null);
    const order = await getOrderAdmin(id);
    return ok(order);
  });
}
