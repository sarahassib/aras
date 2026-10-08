import type { NextRequest } from "next/server";
import { apiRoute, created, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { listProductsAdmin, createProduct } from "@/services/products-admin";
import { productInputSchema, productQuerySchema } from "@/validation/catalog";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();

    const params = request.nextUrl.searchParams;
    const parsed = productQuerySchema.safeParse({
      q: params.get("q") ?? undefined,
      categoryId: params.get("categoryId") ?? undefined,
      subcategoryId: params.get("subcategoryId") ?? undefined,
      status: params.get("status") ?? undefined,
      page: params.get("page") ?? 1,
      perPage: params.get("perPage") ?? 20,
    });

    const result = await listProductsAdmin(
      parsed.success ? parsed.data : { page: 1, perPage: 20 },
    );
    return ok(result);
  });
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const input = await readBody(request, productInputSchema);
    const result = await createProduct(input);
    return created(result);
  });
}
