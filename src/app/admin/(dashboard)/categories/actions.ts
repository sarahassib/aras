"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  type CategoryInput,
  type SubcategoryInput,
} from "@/services/categories";
import { categoryInputSchema, subcategoryInputSchema, reorderSchema } from "@/validation/catalog";

export async function saveCategoryAction(
  id: string | null,
  input: CategoryInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const parsed = categoryInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid category" };
    }
    if (id) await updateCategory(id, parsed.data);
    else await createCategory(parsed.data);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to save category" };
  }
}

export async function deleteCategoryAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await deleteCategory(id);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to delete category" };
  }
}

export async function reorderCategoriesAction(
  ids: string[],
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const parsed = reorderSchema.safeParse({ ids });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid category order" };
    }
    await reorderCategories(parsed.data.ids);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to reorder categories" };
  }
}

export async function saveSubcategoryAction(
  id: string | null,
  input: SubcategoryInput,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const parsed = subcategoryInputSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid subcategory" };
    }
    if (id) await updateSubcategory(id, parsed.data);
    else await createSubcategory(parsed.data);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to save subcategory" };
  }
}

export async function deleteSubcategoryAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await deleteSubcategory(id);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to delete subcategory" };
  }
}
