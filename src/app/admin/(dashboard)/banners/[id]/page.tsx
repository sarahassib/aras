import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listBannersAdmin } from "@/services/banners";
import { BannerForm } from "@/components/admin/banner-form";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Edit banner" };

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const banners = await listBannersAdmin();
  const banner = banners.find((item) => item.id === id);
  if (!banner) notFound();

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
          <h1 className="text-2xl font-bold text-navy-950">Edit banner</h1>
          <p className="text-sm text-muted-foreground">{banner.titleEn}</p>
        </div>
      </div>

      <BannerForm banner={banner} />
    </div>
  );
}
