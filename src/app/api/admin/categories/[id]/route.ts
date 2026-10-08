import type { NextRequest } from "next/server";
import { apiRoute, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { deleteCategory, updateCategory } from "@/services/categories";
import { categoryInputSchema } from "@/validation/catalog";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const input = await readBody(request, categoryInputSchema.partial());
    const category = await updateCategory(id, input);
    return ok(category);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    await deleteCategory(id);
    return ok({ ok: true });
  });
}
