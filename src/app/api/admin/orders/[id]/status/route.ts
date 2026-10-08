import type { NextRequest } from "next/server";
import { apiRoute, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { changeOrderStatus } from "@/services/orders";
import { orderStatusChangeSchema } from "@/validation/admin";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const input = await readBody(request, orderStatusChangeSchema);

    const order = await changeOrderStatus(
      id,
      input.status,
      { id: admin.id, name: admin.name || admin.email },
      input.note ?? null,
    );

    return ok(order);
  });
}
