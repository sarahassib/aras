"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { BannerPlacement } from "@/generated/prisma/client";
import { saveBannerAction } from "@/app/admin/(dashboard)/banners/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface BannerAdminRow {
  id: string;
  placement: BannerPlacement;
  image: string;
  titleFr: string;
  titleAr: string;
  titleEn: string;
  ctaUrl: string | null;
  sortOrder: number;
  active: boolean;
}

const PLACEMENTS: BannerPlacement[] = ["HERO", "MIDDLE", "FOOTER"];

export function BannerForm({ banner }: { banner: BannerAdminRow | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [placement, setPlacement] = useState<BannerPlacement>(banner?.placement ?? "HERO");
  const [image, setImage] = useState(banner?.image ?? "");
  const [titleFr, setTitleFr] = useState(banner?.titleFr ?? "");
  const [titleAr, setTitleAr] = useState(banner?.titleAr ?? "");
  const [titleEn, setTitleEn] = useState(banner?.titleEn ?? "");
  const [ctaUrl, setCtaUrl] = useState(banner?.ctaUrl ?? "");
  const [sortOrder, setSortOrder] = useState(String(banner?.sortOrder ?? 0));
  const [active, setActive] = useState(banner?.active ?? true);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!image.trim()) {
      toast.error("Image URL is required");
      return;
    }
    if (!titleFr.trim() || !titleAr.trim() || !titleEn.trim()) {
      toast.error("Titles are required in French, Arabic and English");
      return;
    }
    startTransition(async () => {
      const result = await saveBannerAction(banner?.id ?? null, {
        placement,
        image: image.trim(),
        titleFr: titleFr.trim(),
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
        ctaUrl: ctaUrl.trim() || null,
        sortOrder: Number.parseInt(sortOrder, 10) || 0,
        active,
      });
      if (result.ok) {
        toast.success(banner ? "Banner updated" : "Banner created");
        router.push("/admin/banners");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save banner");
      }
    });
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white p-6 shadow-xs">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="placement">Placement</Label>
          <Select value={placement} onValueChange={(value) => setPlacement(value as BannerPlacement)}>
            <SelectTrigger id="placement" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLACEMENTS.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort order</Label>
          <Input
            id="sortOrder"
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="image">Image URL</Label>
          <Input
            id="image"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            placeholder="https://…"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="titleEn">Title (English)</Label>
          <Input
            id="titleEn"
            value={titleEn}
            onChange={(event) => setTitleEn(event.target.value)}
            placeholder="Summer collection"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="titleFr">Title (French)</Label>
          <Input
            id="titleFr"
            value={titleFr}
            onChange={(event) => setTitleFr(event.target.value)}
            placeholder="Collection d’été"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="titleAr">Title (Arabic)</Label>
          <Input
            id="titleAr"
            value={titleAr}
            onChange={(event) => setTitleAr(event.target.value)}
            dir="rtl"
            placeholder="المجموعة الصيفية"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ctaUrl">Link URL</Label>
          <Input
            id="ctaUrl"
            value={ctaUrl}
            onChange={(event) => setCtaUrl(event.target.value)}
            placeholder="/catalog or https://…"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 md:col-span-2">
          <div>
            <Label htmlFor="active">Active</Label>
            <p className="text-xs text-muted-foreground">
              Inactive banners are hidden on the storefront.
            </p>
          </div>
          <Switch id="active" checked={active} onCheckedChange={setActive} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="bg-navy-950 text-white hover:bg-navy-800"
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : banner ? "Save changes" : "Create banner"}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => router.push("/admin/banners")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
