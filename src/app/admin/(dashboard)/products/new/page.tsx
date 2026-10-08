import type { Metadata } from "next";
import Link from "next/link";
import { listCategoriesAdmin } from "@/services/categories";
import { ProductForm } from "@/components/admin/product-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await listCategoriesAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="flex size-9 items-center justify-center rounded-md border bg-white hover:bg-muted"
          aria-label="Back to products"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-950">New product</h1>
          <p className="text-sm text-muted-foreground">Add a product to the catalog.</p>
        </div>
      </div>

      <ProductForm product={null} categories={categories} />
    </div>
  );
}
