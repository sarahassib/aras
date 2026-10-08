import type { NextRequest } from "next/server";
import { apiRoute, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { bulkSetProductFlags, bulkSetProductStatus } from "@/services/products-admin";
import { productBulkSchema } from "@/validation/catalog";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const input = await readBody(request, productBulkSchema);

    const count =
      input.action.type === "status"
        ? await bulkSetProductStatus(input.ids, input.action.status)
        : await bulkSetProductFlags(input.ids, {
            featured: input.action.featured,
            isNew: input.action.isNew,
            bestSeller: input.action.bestSeller,
          });

    return ok({ updated: count });
  });
}
