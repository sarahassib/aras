import type { NextRequest } from "next/server";
import { apiRoute, created, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { createCategory, listCategoriesAdmin } from "@/services/categories";
import { categoryInputSchema } from "@/validation/catalog";

export const runtime = "nodejs";

export async function GET() {
  return apiRoute(async () => {
    await requireAdmin();
    const categories = await listCategoriesAdmin();
    return ok(categories);
  });
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const input = await readBody(request, categoryInputSchema);
    const category = await createCategory(input);
    return created(category);
  });
}
