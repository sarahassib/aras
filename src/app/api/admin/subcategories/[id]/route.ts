import type { NextRequest } from "next/server";
import { apiRoute, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { deleteSubcategory, updateSubcategory } from "@/services/categories";
import { subcategoryInputSchema } from "@/validation/catalog";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const input = await readBody(request, subcategoryInputSchema.partial());
    const subcategory = await updateSubcategory(id, input);
    return ok(subcategory);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    await deleteSubcategory(id);
    return ok({ ok: true });
  });
}
