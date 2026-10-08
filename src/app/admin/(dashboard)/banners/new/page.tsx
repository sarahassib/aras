import type { Metadata } from "next";
import Link from "next/link";
import { BannerForm } from "@/components/admin/banner-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "New banner" };

export default function NewBannerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/banners"
          className="flex size-9 items-center justify-center rounded-md border bg-white hover:bg-muted"
          aria-label="Back to banners"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-950">New banner</h1>
          <p className="text-sm text-muted-foreground">Add a banner to the storefront.</p>
        </div>
      </div>

      <BannerForm banner={null} />
    </div>
  );
}
