"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteCategoryAction, reorderCategoriesAction } from "@/app/admin/(dashboard)/categories/actions";
import { DeleteConfirmButton } from "@/components/admin/delete-confirm-button";
import type { CategoryAdminRow } from "@/components/admin/category-form";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";

export function CategoryRowActions({
  category,
  ids,
}: {
  category: CategoryAdminRow;
  ids: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const index = ids.indexOf(category.id);

  const move = (offset: number) => {
    const target = index + offset;
    if (index < 0 || target < 0 || target >= ids.length) return;
    const next = [...ids];
    const current = next[index];
    next[index] = next[target];
    next[target] = current;
    startTransition(async () => {
      const result = await reorderCategoriesAction(next);
      if (result.ok) {
        toast.success("Category order saved");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to reorder categories");
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        aria-label={`Move ${category.nameEn} up`}
        disabled={pending || index <= 0}
        onClick={() => move(-1)}
      >
        <ChevronUp className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        aria-label={`Move ${category.nameEn} down`}
        disabled={pending || index < 0 || index >= ids.length - 1}
        onClick={() => move(1)}
      >
        <ChevronDown className="size-4" />
      </Button>
      <Button
        asChild
        variant="outline"
        size="icon"
        className="size-8"
        aria-label={`Edit ${category.nameEn}`}
      >
        <Link href={`/admin/categories/${category.id}`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
      <DeleteConfirmButton
        message={`Delete the category “${category.nameEn}”? Subcategories stay untouched and this cannot be undone.`}
        successMessage="Category deleted"
        onConfirm={() => deleteCategoryAction(category.id)}
      />
    </div>
  );
}
