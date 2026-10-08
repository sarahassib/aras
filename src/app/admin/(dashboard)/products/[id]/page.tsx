import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductAdmin } from "@/services/products-admin";
import { listCategoriesAdmin } from "@/services/categories";
import { ProductForm, type ProductFormProduct } from "@/components/admin/product-form";
import { NotFoundError } from "@/lib/errors";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let product;
  try {
    product = await getProductAdmin(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  const categories = await listCategoriesAdmin();

  const initial: ProductFormProduct = {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    nameFr: product.nameFr,
    nameAr: product.nameAr,
    nameEn: product.nameEn,
    descriptionFr: product.descriptionFr,
    descriptionAr: product.descriptionAr,
    descriptionEn: product.descriptionEn,
    priceMinor: product.price,
    compareAtPriceMinor: product.compareAtPrice,
    stock: product.stock,
    status: product.status,
    featured: product.featured,
    isNew: product.isNew,
    bestSeller: product.bestSeller,
    weightGrams: product.weightGrams,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
    options: product.options.map((option) => ({
      id: option.id,
      attribute: option.attribute,
      value: option.value,
      swatch: option.swatch,
      sortOrder: option.sortOrder,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      priceMinor: variant.price,
      stock: variant.stock,
      sortOrder: variant.sortOrder,
      options: variant.options.map((option) => ({
        attribute: option.attribute,
        value: option.value,
      })),
    })),
  };

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
          <h1 className="text-2xl font-bold text-navy-950">{product.nameFr}</h1>
          <p className="text-sm text-muted-foreground">
            {product.sku} · /{product.slug}
          </p>
        </div>
      </div>

      <ProductForm product={initial} categories={categories} />
    </div>
  );
}
