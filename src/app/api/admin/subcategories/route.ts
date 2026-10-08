import type { NextRequest } from "next/server";
import { apiRoute, created, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import {
  createSubcategory,
  reorderCategories,
  reorderSubcategories,
} from "@/services/categories";
import { subcategoryInputSchema, reorderSchema } from "@/validation/catalog";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const input = await readBody(request, subcategoryInputSchema);
    const subcategory = await createSubcategory(input);
    return created(subcategory);
  });
}

/** Reorder both category trees: { ids } for categories,
 *  { categoryId, ids } for one category's subcategories. */
export async function PUT(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const input = await readBody(request, reorderSchema);

    if (input.categoryId) {
      await reorderSubcategories(input.categoryId, input.ids);
    } else {
      await reorderCategories(input.ids);
    }
    return ok({ ok: true });
  });
}
