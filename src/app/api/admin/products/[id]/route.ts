import type { NextRequest } from "next/server";
import { apiRoute, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import {
  deleteProduct,
  getProductAdmin,
  updateProduct,
} from "@/services/products-admin";
import { productInputSchema } from "@/validation/catalog";
import { readBody } from "@/lib/api";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const product = await getProductAdmin(id);
    return ok(product);
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const input = await readBody(request, productInputSchema);
    const result = await updateProduct(id, input);
    return ok(result);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    await deleteProduct(id);
    return ok({ ok: true });
  });
}
