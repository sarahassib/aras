import type { NextRequest } from "next/server";
import { apiRoute, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { listOrdersAdmin } from "@/services/orders";
import { orderQuerySchema } from "@/validation/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();

    const params = request.nextUrl.searchParams;
    const parsed = orderQuerySchema.safeParse({
      status: params.get("status") ?? undefined,
      paymentStatus: params.get("paymentStatus") ?? undefined,
      q: params.get("q") ?? undefined,
      page: params.get("page") ?? 1,
      perPage: params.get("perPage") ?? 20,
    });

    const result = await listOrdersAdmin(
      parsed.success ? parsed.data : { page: 1, perPage: 20 },
    );
    return ok(result);
  });
}
