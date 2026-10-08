import type { Metadata } from "next";
import Link from "next/link";
import { listReviewsAdmin } from "@/services/reviews";
import { ReviewRowActions } from "@/components/admin/review-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star } from "lucide-react";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const result = await listReviewsAdmin(page, 20);

  const qs = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { page: sp.page, ...next };
    for (const [key, value] of Object.entries(merged)) {
      if (value && !(key === "page" && value === "1")) params.set(key, value);
    }
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Reviews</h1>
          <p className="text-sm text-muted-foreground">{result.total} total reviews</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No reviews yet.
                </TableCell>
              </TableRow>
            )}
            {result.items.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <p className="font-medium">{review.product.nameFr}</p>
                  <p className="text-xs text-muted-foreground">/{review.product.slug}</p>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                    <Star className="size-3.5 fill-amber-500 text-amber-500" />
                    {review.rating}.0
                  </span>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{review.user.name || "Client"}</p>
                  <p className="text-xs text-muted-foreground">{review.user.email}</p>
                </TableCell>
                <TableCell className="max-w-md">
                  {review.title && <p className="font-medium">{review.title}</p>}
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {review.comment ?? "—"}
                  </p>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {review.createdAt.toLocaleDateString("en-GB")}
                </TableCell>
                <TableCell>
                  <ReviewRowActions review={review} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {result.pages > 1 && (
        <nav className="flex justify-center gap-1.5">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={qs({ page: String(p) })}
              className={`min-w-9 rounded-md border px-3 py-1.5 text-center text-sm ${
                p === result.page
                  ? "border-navy-950 bg-navy-950 font-semibold text-white"
                  : "text-muted-foreground hover:border-foreground"
              }`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
