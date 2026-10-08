import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NotFoundError } from "@/lib/errors";
import { getPromotion } from "@/services/promotions";
import { listCategoriesAdmin } from "@/services/categories";
import { listProductsAdmin } from "@/services/products-admin";
import { PromotionForm, type PromotionTargetOption } from "@/components/admin/promotion-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Edit promotion" };

function withFallback(options: PromotionTargetOption[], targetId: string): PromotionTargetOption[] {
  return options.some((option) => option.id === targetId)
    ? options
    : [...options, { id: targetId, label: targetId }];
}

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let promotion;
  try {
    promotion = await getPromotion(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const [categories, products] = await Promise.all([
    listCategoriesAdmin(),
    listProductsAdmin({ perPage: 100 }),
  ]);

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    label: category.nameEn,
  }));
  const productOptions = products.items.map((product) => ({
    id: product.id,
    label: `${product.name} · ${product.sku}`,
  }));

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
          <h1 className="text-2xl font-bold text-navy-950">Edit promotion</h1>
          <p className="text-sm text-muted-foreground">{promotion.name}</p>
        </div>
      </div>

      <PromotionForm
        promotion={promotion}
        categories={
          promotion.type === "CATEGORY"
            ? withFallback(categoryOptions, promotion.targetId)
            : categoryOptions
        }
        products={
          promotion.type === "PRODUCT"
            ? withFallback(productOptions, promotion.targetId)
            : productOptions
        }
      />
    </div>
  );
}
