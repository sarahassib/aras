"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { slugify } from "@/lib/slug";
import { saveCategoryAction } from "@/app/admin/(dashboard)/categories/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export interface CategoryAdminRow {
  id: string;
  nameFr: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  icon: string | null;
  descriptionFr: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  sortOrder: number;
  active: boolean;
}

export function CategoryForm({ category }: { category: CategoryAdminRow | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nameEn, setNameEn] = useState(category?.nameEn ?? "");
  const [nameFr, setNameFr] = useState(category?.nameFr ?? "");
  const [nameAr, setNameAr] = useState(category?.nameAr ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [descriptionEn, setDescriptionEn] = useState(category?.descriptionEn ?? "");
  const [descriptionFr, setDescriptionFr] = useState(category?.descriptionFr ?? "");
  const [descriptionAr, setDescriptionAr] = useState(category?.descriptionAr ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [active, setActive] = useState(category?.active ?? true);

  const onNameEnChange = (value: string) => {
    setNameEn(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nameEn.trim() || !nameFr.trim() || !nameAr.trim()) {
      toast.error("Names are required in English, French and Arabic");
      return;
    }
    const finalSlug = slugify(slug.trim());
    if (!finalSlug) {
      toast.error("Slug must contain latin letters or numbers");
      return;
    }
    startTransition(async () => {
      const result = await saveCategoryAction(category?.id ?? null, {
        nameEn: nameEn.trim(),
        nameFr: nameFr.trim(),
        nameAr: nameAr.trim(),
        slug: finalSlug,
        icon: icon.trim() || null,
        descriptionEn: descriptionEn.trim() || null,
        descriptionFr: descriptionFr.trim() || null,
        descriptionAr: descriptionAr.trim() || null,
        sortOrder: Number.parseInt(sortOrder, 10) || 0,
        active,
      });
      if (result.ok) {
        toast.success(category ? "Category updated" : "Category created");
        router.push("/admin/categories");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save category");
      }
    });
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white p-6 shadow-xs">
      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="category-name-en">Name (English)</Label>
          <Input
            id="category-name-en"
            value={nameEn}
            onChange={(event) => onNameEnChange(event.target.value)}
            placeholder="Dresses"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-name-fr">Name (French)</Label>
          <Input
            id="category-name-fr"
            value={nameFr}
            onChange={(event) => setNameFr(event.target.value)}
            placeholder="Robes"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-name-ar">Name (Arabic)</Label>
          <Input
            id="category-name-ar"
            dir="rtl"
            value={nameAr}
            onChange={(event) => setNameAr(event.target.value)}
            placeholder="فساتين"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category-slug">Slug</Label>
          <Input
            id="category-slug"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugTouched(true);
            }}
            placeholder="dresses"
          />
          <p className="text-xs text-muted-foreground">
            Lowercase latin letters, numbers and dashes.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-icon">Icon</Label>
          <Input
            id="category-icon"
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            placeholder="dress"
          />
          <p className="text-xs text-muted-foreground">Optional icon name for the menu.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-sort">Sort order</Label>
          <Input
            id="category-sort"
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="category-description-en">Description (English)</Label>
          <Textarea
            id="category-description-en"
            rows={3}
            value={descriptionEn}
            onChange={(event) => setDescriptionEn(event.target.value)}
            placeholder="Short category description"
          />
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="category-description-fr">Description (French)</Label>
          <Textarea
            id="category-description-fr"
            rows={3}
            value={descriptionFr}
            onChange={(event) => setDescriptionFr(event.target.value)}
            placeholder="Short category description"
          />
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="category-description-ar">Description (Arabic)</Label>
          <Textarea
            id="category-description-ar"
            dir="rtl"
            rows={3}
            value={descriptionAr}
            onChange={(event) => setDescriptionAr(event.target.value)}
            placeholder="Short category description"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 md:col-span-3">
          <div>
            <Label htmlFor="category-active">Active</Label>
            <p className="text-xs text-muted-foreground">
              Inactive categories are hidden on the storefront.
            </p>
          </div>
          <Switch id="category-active" checked={active} onCheckedChange={setActive} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="bg-navy-950 text-white hover:bg-navy-800"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : category ? (
            "Save changes"
          ) : (
            "Create category"
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => router.push("/admin/categories")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
