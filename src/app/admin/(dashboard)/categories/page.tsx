import type { Metadata } from "next";
import Link from "next/link";
import { listCategoriesAdmin } from "@/services/categories";
import { ActiveBadge } from "@/components/admin/status-badge";
import { CategoryRowActions } from "@/components/admin/category-row-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesAdmin();
  const ids = categories.map((category) => category.id);
  const subcategoryCount = categories.reduce(
    (total, category) => total + category.subcategories.length,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Categories</h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} categories · {subcategoryCount} subcategories
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-navy-950 px-4 text-sm font-semibold text-white hover:bg-navy-800"
        >
          <Plus className="size-4" /> New category
        </Link>
      </div>

      <div className="rounded-xl border bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-end">Subcategories</TableHead>
              <TableHead className="text-end">Products</TableHead>
              <TableHead className="text-end">Sort</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            )}
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Link
                    href={`/admin/categories/${category.id}`}
                    className="font-medium text-navy-950 hover:text-gold-600"
                  >
                    {category.nameEn}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {category.nameFr} · <span className="font-mono">{category.slug}</span>
                  </p>
                </TableCell>
                <TableCell className="text-end text-sm text-muted-foreground">
                  {category.subcategories.length}
                </TableCell>
                <TableCell className="text-end text-sm text-muted-foreground">
                  {category.productCount}
                </TableCell>
                <TableCell className="text-end text-sm text-muted-foreground">
                  {category.sortOrder}
                </TableCell>
                <TableCell>
                  <ActiveBadge active={category.active} />
                </TableCell>
                <TableCell>
                  <CategoryRowActions category={category} ids={ids} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
