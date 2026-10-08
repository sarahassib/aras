import type { Metadata } from "next";
import Link from "next/link";
import { listCategoriesAdmin } from "@/services/categories";
import { listProductsAdmin } from "@/services/products-admin";
import { PromotionForm } from "@/components/admin/promotion-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "New promotion" };

export default async function NewPromotionPage() {
  const [categories, products] = await Promise.all([
    listCategoriesAdmin(),
    listProductsAdmin({ perPage: 100 }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/promotions"
          className="flex size-9 items-center justify-center rounded-md border bg-white hover:bg-muted"
          aria-label="Back to promotions"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-950">New promotion</h1>
          <p className="text-sm text-muted-foreground">
            Automatic percentage discount on a product or a category.
          </p>
        </div>
      </div>

      <PromotionForm
        promotion={null}
        categories={categories.map((category) => ({ id: category.id, label: category.nameEn }))}
        products={products.items.map((product) => ({
          id: product.id,
          label: `${product.name} · ${product.sku}`,
        }))}
      />
    </div>
  );
}
