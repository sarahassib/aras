import type { NextRequest } from "next/server";
import { apiRoute, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { promotionInputSchema } from "@/validation/admin";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const input = await readBody(request, promotionInputSchema.partial());

    const existing = await db.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Promotion not found");

    const promotion = await db.promotion.update({ where: { id }, data: input });
    return ok(promotion);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const existing = await db.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Promotion not found");
    await db.promotion.delete({ where: { id } });
    return ok({ ok: true });
  });
}
