import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listCategoriesAdmin } from "@/services/categories";
import { CategoryForm } from "@/components/admin/category-form";
import {
  NewSubcategoryButton,
  SubcategoryRowActions,
} from "@/components/admin/subcategory-actions";
import { ActiveBadge } from "@/components/admin/status-badge";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categories = await listCategoriesAdmin();
  const category = categories.find((item) => item.id === id);
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/categories"
          className="flex size-9 items-center justify-center rounded-md border bg-white hover:bg-muted"
          aria-label="Back to categories"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Edit category</h1>
          <p className="text-sm text-muted-foreground">{category.nameEn}</p>
        </div>
      </div>

      <CategoryForm category={category} />

      <div className="rounded-xl border bg-white p-6 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-navy-950">Subcategories</h2>
            <p className="text-xs text-muted-foreground">
              {category.subcategories.length} subcategories
            </p>
          </div>
          <NewSubcategoryButton categoryId={category.id} />
        </div>

        {category.subcategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subcategories yet.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {category.subcategories.map((subcategory) => (
              <li
                key={subcategory.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{subcategory.nameEn}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono">{subcategory.slug}</span> ·{" "}
                    {subcategory.productCount} products · sort {subcategory.sortOrder}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ActiveBadge active={subcategory.active} />
                  <SubcategoryRowActions subcategory={subcategory} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
