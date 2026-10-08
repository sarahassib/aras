import type { NextRequest } from "next/server";
import { apiRoute, created, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { listDeliveryZones, upsertDeliveryZone } from "@/services/delivery";
import { deliveryZoneInputSchema } from "@/validation/admin";

export const runtime = "nodejs";

export async function GET() {
  return apiRoute(async () => {
    await requireAdmin();
    const zones = await listDeliveryZones();
    return ok(zones);
  });
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const input = await readBody(request, deliveryZoneInputSchema);
    const zone = await upsertDeliveryZone(input);
    return created(zone);
  });
}
