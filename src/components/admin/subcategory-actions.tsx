"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { slugify } from "@/lib/slug";
import {
  saveSubcategoryAction,
  deleteSubcategoryAction,
} from "@/app/admin/(dashboard)/categories/actions";
import { DeleteConfirmButton } from "@/components/admin/delete-confirm-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Pencil, Plus } from "lucide-react";

export interface SubcategoryRow {
  id: string;
  categoryId: string;
  nameFr: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  active: boolean;
}

function SubcategoryForm({
  subcategory,
  categoryId,
  onSaved,
}: {
  subcategory?: SubcategoryRow;
  categoryId?: string;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nameEn, setNameEn] = useState(subcategory?.nameEn ?? "");
  const [nameFr, setNameFr] = useState(subcategory?.nameFr ?? "");
  const [nameAr, setNameAr] = useState(subcategory?.nameAr ?? "");
  const [slug, setSlug] = useState(subcategory?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(subcategory));
  const [sortOrder, setSortOrder] = useState(String(subcategory?.sortOrder ?? 0));
  const [active, setActive] = useState(subcategory?.active ?? true);

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
    const parentCategoryId = subcategory?.categoryId ?? categoryId;
    if (!parentCategoryId) {
      toast.error("Missing parent category");
      return;
    }
    startTransition(async () => {
      const result = await saveSubcategoryAction(subcategory?.id ?? null, {
        categoryId: parentCategoryId,
        nameEn: nameEn.trim(),
        nameFr: nameFr.trim(),
        nameAr: nameAr.trim(),
        slug: finalSlug,
        sortOrder: Number.parseInt(sortOrder, 10) || 0,
        active,
      });
      if (result.ok) {
        toast.success(subcategory ? "Subcategory updated" : "Subcategory created");
        onSaved();
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save subcategory");
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="subcategory-name-en">Name (English)</Label>
          <Input
            id="subcategory-name-en"
            value={nameEn}
            onChange={(event) => onNameEnChange(event.target.value)}
            placeholder="Maxi dresses"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subcategory-name-fr">Name (French)</Label>
          <Input
            id="subcategory-name-fr"
            value={nameFr}
            onChange={(event) => setNameFr(event.target.value)}
            placeholder="Robes longues"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subcategory-name-ar">Name (Arabic)</Label>
          <Input
            id="subcategory-name-ar"
            dir="rtl"
            value={nameAr}
            onChange={(event) => setNameAr(event.target.value)}
            placeholder="فساتين طويلة"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subcategory-slug">Slug</Label>
          <Input
            id="subcategory-slug"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              setSlugTouched(true);
            }}
            placeholder="maxi-dresses"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subcategory-sort">Sort order</Label>
          <Input
            id="subcategory-sort"
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
        <div>
          <Label htmlFor="subcategory-active">Active</Label>
          <p className="text-xs text-muted-foreground">
            Inactive subcategories are hidden on the storefront.
          </p>
        </div>
        <Switch id="subcategory-active" checked={active} onCheckedChange={setActive} />
      </div>

      <DialogFooter>
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="bg-navy-950 text-white hover:bg-navy-800"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : subcategory ? (
            "Save changes"
          ) : (
            "Create subcategory"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function NewSubcategoryButton({ categoryId }: { categoryId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-navy-950 text-white hover:bg-navy-800">
          <Plus className="size-4" /> New subcategory
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New subcategory</DialogTitle>
          <DialogDescription>Subcategories appear inside the category menu.</DialogDescription>
        </DialogHeader>
        <SubcategoryForm categoryId={categoryId} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function SubcategoryRowActions({ subcategory }: { subcategory: SubcategoryRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label={`Edit ${subcategory.nameEn}`}
          >
            <Pencil className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit subcategory</DialogTitle>
            <DialogDescription>{subcategory.nameEn}</DialogDescription>
          </DialogHeader>
          <SubcategoryForm subcategory={subcategory} onSaved={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
      <DeleteConfirmButton
        message={`Delete the subcategory “${subcategory.nameEn}”? This cannot be undone.`}
        successMessage="Subcategory deleted"
        onConfirm={async () => {
          const result = await deleteSubcategoryAction(subcategory.id);
          if (result.ok) router.refresh();
          return result;
        }}
      />
    </div>
  );
}
