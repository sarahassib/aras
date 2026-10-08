import type { Metadata } from "next";
import Link from "next/link";
import { listPromotions } from "@/services/promotions";
import { listCategoriesAdmin } from "@/services/categories";
import { listProductsAdmin } from "@/services/products-admin";
import { ActiveBadge, Badge } from "@/components/admin/status-badge";
import { PromotionRowActions } from "@/components/admin/promotion-row-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Promotions" };

function formatSchedule(startsAt: Date | null, endsAt: Date | null): string {
  const start = startsAt ? startsAt.toLocaleDateString("en-GB") : "—";
  const end = endsAt ? endsAt.toLocaleDateString("en-GB") : "—";
  return `${start} → ${end}`;
}

export default async function AdminPromotionsPage() {
  const [promotions, categories, products] = await Promise.all([
    listPromotions(),
    listCategoriesAdmin(),
    listProductsAdmin({ perPage: 100 }),
  ]);

  const categoryNames = new Map(categories.map((category) => [category.id, category.nameEn]));
  const productNames = new Map(products.items.map((product) => [product.id, product.name]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Promotions</h1>
          <p className="text-sm text-muted-foreground">
            {promotions.length} automatic discounts applied to products or categories
          </p>
        </div>
        <Link
          href="/admin/promotions/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-navy-950 px-4 text-sm font-semibold text-white hover:bg-navy-800"
        >
          <Plus className="size-4" /> New promotion
        </Link>
      </div>

      <div className="rounded-xl border bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="text-end">Discount</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Sort</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No promotions yet.
                </TableCell>
              </TableRow>
            )}
            {promotions.map((promotion) => {
              const targetName =
                promotion.type === "CATEGORY"
                  ? categoryNames.get(promotion.targetId)
                  : productNames.get(promotion.targetId);

              return (
                <TableRow key={promotion.id}>
                  <TableCell>
                    <Link
                      href={`/admin/promotions/${promotion.id}`}
                      className="font-medium text-navy-950 hover:text-gold-600"
                    >
                      {promotion.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        promotion.type === "CATEGORY"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-violet-100 text-violet-800"
                      }
                    >
                      {promotion.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {targetName ? (
                      <span className="text-muted-foreground">{targetName}</span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        {promotion.targetId}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-end font-semibold">
                    {promotion.percent}% off
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatSchedule(promotion.startsAt, promotion.endsAt)}
                  </TableCell>
                  <TableCell>
                    <ActiveBadge active={promotion.active} />
                  </TableCell>
                  <TableCell className="text-end text-sm text-muted-foreground">
                    {promotion.sortOrder}
                  </TableCell>
                  <TableCell>
                    <PromotionRowActions promotion={promotion} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
