"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  setProductStock,
  type ProductInput,
} from "@/services/products-admin";
import { productInputSchema } from "@/validation/catalog";

export async function createProductAction(
  input: ProductInput,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    await requireAdmin();
    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid product data" };
    }
    const result = await createProduct(parsed.data);
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${result.id}`);
    revalidatePath("/admin");
    return { ok: true, id: result.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create product" };
  }
}

export async function updateProductAction(
  id: string,
  input: ProductInput,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    await requireAdmin();
    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid product data" };
    }
    const result = await updateProduct(id, parsed.data);
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/admin");
    return { ok: true, id: result.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update product" };
  }
}

export async function deleteProductAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await deleteProduct(id);
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to delete product" };
  }
}

export async function setProductStockAction(
  id: string,
  stock: number,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const value = Math.max(0, Math.trunc(Number(stock) || 0));
    await setProductStock(id, value);
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update stock" };
  }
}
