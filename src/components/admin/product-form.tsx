"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ProductStatus } from "@/generated/prisma/client";
import type { AdminCategoryDTO } from "@/services/categories";
import type { ProductInput } from "@/services/products-admin";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/admin/(dashboard)/products/actions";
import { productInputSchema } from "@/validation/catalog";
import { parseAmountToMinor, toMajor } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2 } from "lucide-react";

export type ProductFormProduct = ProductInput & { id: string };

type OptionPair = { attribute: string; value: string };
type OptionGroupState = { attribute: string; values: string };
type OptionGroup = { attribute: string; values: string[] };
type VariantRow = { id?: string; sku: string; price: string; stock: string };
type ImageRow = { url: string; alt: string | null };

const STATUSES: ProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];
const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};
const NONE_VALUE = "__none";
const MAX_VARIANT_COMBINATIONS = 100;

function parseOptionGroups(groups: OptionGroupState[]): OptionGroup[] {
  return groups
    .map((group) => ({
      attribute: group.attribute.trim(),
      values: group.values
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    }))
    .filter((group) => group.attribute.length > 0 && group.values.length > 0);
}

function buildCombinations(groups: OptionGroup[]): OptionPair[][] {
  if (groups.length === 0) return [];
  return groups.reduce<OptionPair[][]>(
    (acc, group) => {
      const next: OptionPair[][] = [];
      for (const base of acc) {
        for (const value of group.values) {
          next.push([...base, { attribute: group.attribute, value }]);
        }
      }
      return next;
    },
    [[]],
  );
}

function comboKey(options: OptionPair[]): string {
  return [...options]
    .sort((a, b) => `${a.attribute}::${a.value}`.localeCompare(`${b.attribute}::${b.value}`))
    .map((option) => `${option.attribute.trim().toLowerCase()}::${option.value.trim()}`)
    .join("|");
}

function valueKey(options: OptionPair[]): string {
  return options
    .map((option) => option.value.trim().toLowerCase())
    .sort()
    .join("|");
}

function defaultVariantSku(baseSku: string, options: OptionPair[]): string {
  const suffix = options
    .map((option) => slugify(option.value))
    .filter(Boolean)
    .join("-");
  return `${baseSku.trim() || "SKU"}${suffix ? `-${suffix}` : ""}`.toUpperCase();
}

function groupInitialOptions(product: ProductFormProduct | null): OptionGroupState[] {
  if (!product) return [];
  const map = new Map<string, string[]>();
  for (const option of product.options ?? []) {
    const values = map.get(option.attribute) ?? [];
    values.push(option.value);
    map.set(option.attribute, values);
  }
  return Array.from(map.entries()).map(([attribute, values]) => ({
    attribute,
    values: values.join(", "),
  }));
}

function groupInitialVariants(product: ProductFormProduct | null): Record<string, VariantRow> {
  const rows: Record<string, VariantRow> = {};
  if (!product) return rows;
  for (const variant of product.variants ?? []) {
    if (!variant.options || variant.options.length === 0) continue;
    rows[comboKey(variant.options)] = {
      id: variant.id,
      sku: variant.sku,
      price: variant.priceMinor != null ? String(toMajor(variant.priceMinor)) : "",
      stock: String(variant.stock),
    };
  }
  return rows;
}

export function ProductForm({
  product,
  categories,
}: {
  product: ProductFormProduct | null;
  categories: AdminCategoryDTO[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [sku, setSku] = useState(product?.sku ?? "");
  const [editedSlug, setEditedSlug] = useState<string | null>(product?.slug ?? null);
  const [status, setStatus] = useState<ProductStatus>(product?.status ?? "ACTIVE");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [subcategoryId, setSubcategoryId] = useState(product?.subcategoryId ?? "");
  const [nameFr, setNameFr] = useState(product?.nameFr ?? "");
  const [nameAr, setNameAr] = useState(product?.nameAr ?? "");
  const [nameEn, setNameEn] = useState(product?.nameEn ?? "");
  const [descriptionFr, setDescriptionFr] = useState(product?.descriptionFr ?? "");
  const [descriptionAr, setDescriptionAr] = useState(product?.descriptionAr ?? "");
  const [descriptionEn, setDescriptionEn] = useState(product?.descriptionEn ?? "");
  const [price, setPrice] = useState(product ? String(toMajor(product.priceMinor)) : "");
  const [compareAt, setCompareAt] = useState(
    product?.compareAtPriceMinor != null ? String(toMajor(product.compareAtPriceMinor)) : "",
  );
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [weightGrams, setWeightGrams] = useState(
    product?.weightGrams != null ? String(product.weightGrams) : "",
  );
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [bestSeller, setBestSeller] = useState(product?.bestSeller ?? false);
  const [metaTitle, setMetaTitle] = useState(product?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(product?.metaDescription ?? "");
  const [images, setImages] = useState<ImageRow[]>(() => {
    const rows = (product?.images ?? []).map((image) => ({
      url: image.url,
      alt: image.alt ?? null,
    }));
    return rows.length > 0 ? rows : [{ url: "", alt: null }];
  });
  const [optionGroups, setOptionGroups] = useState<OptionGroupState[]>(() =>
    groupInitialOptions(product),
  );
  const [variantRows, setVariantRows] = useState<Record<string, VariantRow>>(() =>
    groupInitialVariants(product),
  );

  const slug = editedSlug?.trim() ? editedSlug : slugify(nameFr);

  const groups = parseOptionGroups(optionGroups);
  const combinations = buildCombinations(groups);
  const hasVariants = combinations.length > 0;
  const overCombinationLimit = combinations.length > MAX_VARIANT_COMBINATIONS;
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const subcategories = selectedCategory?.subcategories ?? [];

  const rowFor = (combo: OptionPair[]): VariantRow => {
    const exact = variantRows[comboKey(combo)];
    if (exact) return exact;
    const key = valueKey(combo);
    const match = (product?.variants ?? []).find(
      (variant) => variant.options?.length && valueKey(variant.options) === key,
    );
    if (match) {
      return {
        id: match.id,
        sku: match.sku,
        price: match.priceMinor != null ? String(toMajor(match.priceMinor)) : "",
        stock: String(match.stock),
      };
    }
    return { sku: defaultVariantSku(sku, combo), price: "", stock: "0" };
  };

  const swatchFor = (attribute: string, value: string): string | null => {
    const match = (product?.options ?? []).find(
      (option) =>
        option.attribute.trim().toLowerCase() === attribute.trim().toLowerCase() &&
        option.value.trim().toLowerCase() === value.trim().toLowerCase(),
    );
    return match?.swatch ?? null;
  };

  const setImageUrl = (index: number, url: string) => {
    setImages((current) =>
      current.map((image, i) => (i === index ? { ...image, url } : image)),
    );
  };

  const removeImage = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index));
  };

  const setGroupField = (index: number, field: keyof OptionGroupState, value: string) => {
    setOptionGroups((current) =>
      current.map((group, i) => (i === index ? { ...group, [field]: value } : group)),
    );
  };

  const removeGroup = (index: number) => {
    setOptionGroups((current) => current.filter((_, i) => i !== index));
  };

  const addGroup = () => {
    setOptionGroups((current) => [...current, { attribute: "", values: "" }]);
  };

  const setVariantField = (key: string, row: VariantRow, field: keyof VariantRow, value: string) => {
    setVariantRows((current) => ({
      ...current,
      [key]: { ...row, [field]: value },
    }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sku.trim()) {
      toast.error("SKU is required");
      return;
    }
    if (!nameFr.trim() || !nameAr.trim() || !nameEn.trim()) {
      toast.error("Product names are required in French, Arabic and English");
      return;
    }
    if (!categoryId) {
      toast.error("Select a category");
      return;
    }
    if (!price.trim()) {
      toast.error("Price is required");
      return;
    }

    let priceMinor: number;
    try {
      priceMinor = parseAmountToMinor(price);
    } catch {
      toast.error("Enter a valid price");
      return;
    }

    let compareAtPriceMinor: number | null = null;
    if (compareAt.trim()) {
      try {
        compareAtPriceMinor = parseAmountToMinor(compareAt);
      } catch {
        toast.error("Enter a valid compare-at price");
        return;
      }
    }

    const activeGroups = parseOptionGroups(optionGroups);
    const activeCombinations = buildCombinations(activeGroups);
    if (activeCombinations.length > MAX_VARIANT_COMBINATIONS) {
      toast.error(
        `Too many variant combinations (${activeCombinations.length}), the maximum is ${MAX_VARIANT_COMBINATIONS}`,
      );
      return;
    }

    let payload: ProductInput;
    try {
      const options = activeGroups.flatMap((group) =>
        group.values.map((value) => ({
          attribute: group.attribute,
          value,
          swatch: swatchFor(group.attribute, value),
        })),
      );
      const variants = activeCombinations.map((combo, index) => {
        const row = rowFor(combo);
        const variantSku = row.sku.trim().toUpperCase();
        if (!variantSku) throw new Error("Each variant needs a SKU");
        return {
          id: row.id,
          sku: variantSku,
          priceMinor: row.price.trim() ? parseAmountToMinor(row.price) : null,
          stock: Math.max(0, Number.parseInt(row.stock, 10) || 0),
          sortOrder: index,
          options: combo,
        };
      });
      payload = {
        sku: sku.trim(),
        slug: slugify(slug.trim()),
        nameFr: nameFr.trim(),
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        descriptionFr,
        descriptionAr,
        descriptionEn,
        priceMinor,
        compareAtPriceMinor,
        stock: Math.max(0, Number.parseInt(stock, 10) || 0),
        status,
        featured,
        isNew,
        bestSeller,
        weightGrams: weightGrams.trim()
          ? Math.max(0, Number.parseInt(weightGrams, 10) || 0)
          : null,
        categoryId,
        subcategoryId: subcategoryId || null,
        metaTitle: metaTitle.trim() || null,
        metaDescription: metaDescription.trim() || null,
        images: images
          .map((image, index) => ({ url: image.url.trim(), alt: image.alt, sortOrder: index }))
          .filter((image) => image.url.length > 0),
        options,
        variants,
      };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid variant data");
      return;
    }

    const parsed = productInputSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid product data");
      return;
    }

    startTransition(async () => {
      const result = product
        ? await updateProductAction(product.id, parsed.data)
        : await createProductAction(parsed.data);
      if (result.ok) {
        toast.success(product ? "Product updated" : "Product created");
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save product");
      }
    });
  };

  const removeProduct = () => {
    if (!product) return;
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteProductAction(product.id);
      if (result.ok) {
        toast.success("Product deleted");
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete product");
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-xs">
        <h2 className="mb-4 text-sm font-semibold text-navy-950">Product information</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="product-sku">SKU</Label>
            <Input
              id="product-sku"
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              placeholder="ARAS-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as ProductStatus)}>
              <SelectTrigger id="product-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-category">Category</Label>
            <Select
              value={categoryId || NONE_VALUE}
              onValueChange={(value) => {
                setCategoryId(value === NONE_VALUE ? "" : value);
                setSubcategoryId("");
              }}
            >
              <SelectTrigger id="product-category" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Select a category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.nameFr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-subcategory">Subcategory</Label>
            <Select
              value={subcategoryId || NONE_VALUE}
              onValueChange={(value) => setSubcategoryId(value === NONE_VALUE ? "" : value)}
            >
              <SelectTrigger id="product-subcategory" className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {subcategories.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.nameFr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="product-slug">Slug</Label>
            <Input
              id="product-slug"
              value={slug}
              onChange={(event) => setEditedSlug(event.target.value)}
              placeholder="generated-from-the-french-name"
            />
            <p className="text-xs text-muted-foreground">
              Generated from the French name unless you edit it.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-xs">
        <h2 className="mb-4 text-sm font-semibold text-navy-950">Translations</h2>
        <Tabs defaultValue="fr">
          <TabsList>
            <TabsTrigger value="fr">French</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="ar">Arabic</TabsTrigger>
          </TabsList>

          <TabsContent value="fr" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="product-name-fr">Name (French)</Label>
              <Input
                id="product-name-fr"
                value={nameFr}
                onChange={(event) => setNameFr(event.target.value)}
                placeholder="Robe d’été"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description-fr">Description (French)</Label>
              <Textarea
                id="product-description-fr"
                rows={4}
                value={descriptionFr}
                onChange={(event) => setDescriptionFr(event.target.value)}
                placeholder="Matière, coupe, entretien…"
              />
            </div>
          </TabsContent>

          <TabsContent value="en" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="product-name-en">Name (English)</Label>
              <Input
                id="product-name-en"
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                placeholder="Summer dress"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description-en">Description (English)</Label>
              <Textarea
                id="product-description-en"
                rows={4}
                value={descriptionEn}
                onChange={(event) => setDescriptionEn(event.target.value)}
                placeholder="Fabric, fit, care…"
              />
            </div>
          </TabsContent>

          <TabsContent value="ar" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="product-name-ar">Name (Arabic)</Label>
              <Input
                id="product-name-ar"
                dir="rtl"
                value={nameAr}
                onChange={(event) => setNameAr(event.target.value)}
                placeholder="فستان الصيف"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description-ar">Description (Arabic)</Label>
              <Textarea
                id="product-description-ar"
                dir="rtl"
                rows={4}
                value={descriptionAr}
                onChange={(event) => setDescriptionAr(event.target.value)}
                placeholder="الخامة، القصة، العناية…"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-xs">
        <h2 className="mb-4 text-sm font-semibold text-navy-950">Pricing &amp; inventory</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="product-price">Price (DH)</Label>
            <div className="relative">
              <Input
                id="product-price"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                inputMode="decimal"
                placeholder="0"
                className="pe-10"
              />
              <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-muted-foreground">
                DH
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-compare-at">Compare-at price (DH)</Label>
            <div className="relative">
              <Input
                id="product-compare-at"
                value={compareAt}
                onChange={(event) => setCompareAt(event.target.value)}
                inputMode="decimal"
                placeholder="Optional"
                className="pe-10"
              />
              <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-muted-foreground">
                DH
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Shown struck through when it is above the price.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-stock">Stock</Label>
            <Input
              id="product-stock"
              type="number"
              min={0}
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              placeholder="0"
              disabled={hasVariants}
            />
            <p className="text-xs text-muted-foreground">
              {hasVariants
                ? "Managed by the variant stock below."
                : "Units available to sell."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-weight">Weight (g)</Label>
            <Input
              id="product-weight"
              type="number"
              min={0}
              value={weightGrams}
              onChange={(event) => setWeightGrams(event.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-xs">
        <h2 className="mb-4 text-sm font-semibold text-navy-950">Flags</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
            <div>
              <Label htmlFor="product-featured">Featured</Label>
              <p className="text-xs text-muted-foreground">
                Highlighted on the homepage featured section.
              </p>
            </div>
            <Switch id="product-featured" checked={featured} onCheckedChange={setFeatured} />
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
            <div>
              <Label htmlFor="product-is-new">New</Label>
              <p className="text-xs text-muted-foreground">
                Displays a “New” badge on the storefront.
              </p>
            </div>
            <Switch id="product-is-new" checked={isNew} onCheckedChange={setIsNew} />
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
            <div>
              <Label htmlFor="product-best-seller">Best seller</Label>
              <p className="text-xs text-muted-foreground">
                Included in the best-sellers selection.
              </p>
            </div>
            <Switch id="product-best-seller" checked={bestSeller} onCheckedChange={setBestSeller} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-950">Images</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setImages((current) => [...current, { url: "", alt: null }])}
          >
            <Plus className="size-4" /> Add image
          </Button>
        </div>
        <div className="space-y-3">
          {images.length === 0 && (
            <p className="text-sm text-muted-foreground">No images yet.</p>
          )}
          {images.map((image, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                {index === 0 ? "Primary" : `#${index + 1}`}
              </span>
              <Input
                value={image.url}
                onChange={(event) => setImageUrl(index, event.target.value)}
                placeholder="https://…"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 shrink-0 text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => removeImage(index)}
                aria-label="Remove image"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-950">Options &amp; variants</h2>
          <Button type="button" variant="outline" size="sm" onClick={addGroup}>
            <Plus className="size-4" /> Add option
          </Button>
        </div>

        <div className="space-y-4">
          {optionGroups.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No options — this product has a single variant.
            </p>
          )}
          {optionGroups.map((group, index) => (
            <div key={index} className="grid items-end gap-3 sm:grid-cols-[1fr_2fr_auto]">
              <div className="space-y-2">
                <Label htmlFor={`product-option-attribute-${index}`}>Attribute</Label>
                <Input
                  id={`product-option-attribute-${index}`}
                  value={group.attribute}
                  onChange={(event) => setGroupField(index, "attribute", event.target.value)}
                  placeholder="Size"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`product-option-values-${index}`}>Values</Label>
                <Input
                  id={`product-option-values-${index}`}
                  value={group.values}
                  onChange={(event) => setGroupField(index, "values", event.target.value)}
                  placeholder="S, M, L"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => removeGroup(index)}
                aria-label="Remove option"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        {overCombinationLimit && (
          <p className="mt-4 text-sm font-medium text-red-600">
            Too many combinations ({combinations.length}), the maximum is{" "}
            {MAX_VARIANT_COMBINATIONS}.
          </p>
        )}

        {hasVariants && !overCombinationLimit && (
          <div className="mt-6">
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">Variants</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Combination</TableHead>
                  <TableHead className="w-44">SKU</TableHead>
                  <TableHead className="w-36">Price (DH)</TableHead>
                  <TableHead className="w-28">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combinations.map((combo) => {
                  const key = comboKey(combo);
                  const row = rowFor(combo);
                  const label = combo
                    .map((option) => `${option.attribute}: ${option.value}`)
                    .join(" · ");
                  return (
                    <TableRow key={key}>
                      <TableCell className="text-sm font-medium">{label}</TableCell>
                      <TableCell>
                        <Input
                          value={row.sku}
                          onChange={(event) =>
                            setVariantField(key, row, "sku", event.target.value)
                          }
                          placeholder="SKU"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.price}
                          onChange={(event) =>
                            setVariantField(key, row, "price", event.target.value)
                          }
                          inputMode="decimal"
                          placeholder="Base price"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={row.stock}
                          onChange={(event) =>
                            setVariantField(key, row, "stock", event.target.value)
                          }
                          placeholder="0"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <p className="mt-2 text-xs text-muted-foreground">
              Leave the price empty to use the base price. Product stock is the sum of variant
              stock.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-xs">
        <h2 className="mb-4 text-sm font-semibold text-navy-950">SEO</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="product-meta-title">Meta title</Label>
            <Input
              id="product-meta-title"
              value={metaTitle}
              onChange={(event) => setMetaTitle(event.target.value)}
              placeholder="Optional — 200 characters max"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-meta-description">Meta description</Label>
            <Input
              id="product-meta-description"
              value={metaDescription}
              onChange={(event) => setMetaDescription(event.target.value)}
              placeholder="Optional — 320 characters max"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="bg-navy-950 text-white hover:bg-navy-800"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : product ? (
            "Save changes"
          ) : (
            "Create product"
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </Button>
        {product && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={removeProduct}
            className="ms-auto text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="size-3.5" /> Delete product
          </Button>
        )}
      </div>
    </form>
  );
}
