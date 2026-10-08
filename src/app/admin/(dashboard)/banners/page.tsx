import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listBannersAdmin } from "@/services/banners";
import { ActiveBadge, PlacementBadge } from "@/components/admin/status-badge";
import { BannerRowActions } from "@/components/admin/banner-row-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Banners" };

export default async function AdminBannersPage() {
  const banners = await listBannersAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Banners</h1>
          <p className="text-sm text-muted-foreground">{banners.length} banners across the storefront</p>
        </div>
        <Link
          href="/admin/banners/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-navy-950 px-4 text-sm font-semibold text-white hover:bg-navy-800"
        >
          <Plus className="size-4" /> New banner
        </Link>
      </div>

      <div className="rounded-xl border bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Placement</TableHead>
              <TableHead className="text-end">Sort</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No banners yet.
                </TableCell>
              </TableRow>
            )}
            {banners.map((banner) => (
              <TableRow key={banner.id}>
                <TableCell>
                  <Image
                    src={banner.image}
                    alt={banner.titleEn}
                    width={72}
                    height={44}
                    className="h-11 w-[72px] rounded-md border bg-muted object-cover"
                  />
                </TableCell>
                <TableCell>
                  <p className="font-medium">{banner.titleEn}</p>
                  <p className="text-xs text-muted-foreground" dir="rtl">
                    {banner.titleAr}
                  </p>
                  <p className="text-xs text-muted-foreground">{banner.titleFr}</p>
                </TableCell>
                <TableCell>
                  <PlacementBadge placement={banner.placement} />
                </TableCell>
                <TableCell className="text-end text-sm text-muted-foreground">
                  {banner.sortOrder}
                </TableCell>
                <TableCell>
                  <ActiveBadge active={banner.active} />
                </TableCell>
                <TableCell>
                  <BannerRowActions banner={banner} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
