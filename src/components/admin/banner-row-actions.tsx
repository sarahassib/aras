"use client";

import Link from "next/link";
import { deleteBannerAction } from "@/app/admin/(dashboard)/banners/actions";
import { DeleteConfirmButton } from "@/components/admin/delete-confirm-button";
import type { BannerAdminRow } from "@/components/admin/banner-form";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export function BannerRowActions({ banner }: { banner: BannerAdminRow }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        asChild
        variant="outline"
        size="icon"
        className="size-8"
        aria-label={`Edit ${banner.titleEn}`}
      >
        <Link href={`/admin/banners/${banner.id}`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
      <DeleteConfirmButton
        message={`Delete the banner “${banner.titleEn}”? This cannot be undone.`}
        successMessage="Banner deleted"
        onConfirm={() => deleteBannerAction(banner.id)}
      />
    </div>
  );
}
