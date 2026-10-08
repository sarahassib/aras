import type { NextRequest } from "next/server";
import { apiRoute, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { deleteDeliveryZone, updateDeliveryZone } from "@/services/delivery";
import { deliveryZoneInputSchema } from "@/validation/admin";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const input = await readBody(request, deliveryZoneInputSchema);
    const zone = await updateDeliveryZone(id, input);
    return ok(zone);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    await deleteDeliveryZone(id);
    return ok({ ok: true });
  });
}
