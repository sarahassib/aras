import type { NextRequest } from "next/server";
import { apiRoute, created, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { promotionInputSchema } from "@/validation/admin";

export const runtime = "nodejs";

export async function GET() {
  return apiRoute(async () => {
    await requireAdmin();
    const promotions = await db.promotion.findMany({ orderBy: { sortOrder: "asc" } });
    return ok(promotions);
  });
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const input = await readBody(request, promotionInputSchema);
    const promotion = await db.promotion.create({ data: input });
    return created(promotion);
  });
}
