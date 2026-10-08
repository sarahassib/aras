import type { Metadata } from "next";
import Link from "next/link";
import { listProductsAdmin } from "@/services/products-admin";
import { formatMAD } from "@/lib/money";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Package, Plus } from "lucide-react";

export const metadata: Metadata = { title: "Products" };

const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  ARCHIVED: "bg-slate-200 text-slate-700",
};

function ProductStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {status}
    </span>
  );
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const result = await listProductsAdmin({
    q: sp.q,
    status: PRODUCT_STATUSES.includes(sp.status as ProductStatusValue)
      ? (sp.status as ProductStatusValue)
      : undefined,
    page,
    perPage: 20,
  });

  const qs = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { q: sp.q, status: sp.status, page: sp.page, ...next };
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
          <h1 className="text-2xl font-bold text-navy-950">Products</h1>
          <p className="text-sm text-muted-foreground">{result.total} total products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-navy-950 px-4 text-sm font-semibold text-white hover:bg-navy-800"
        >
          <Plus className="size-4" /> New product
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3" action="/admin/products" method="get">
        <div className="min-w-56 flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Search</label>
          <Input name="q" defaultValue={sp.q ?? ""} placeholder="Name, SKU, slug…" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            {PRODUCT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-9 rounded-md bg-navy-950 px-4 text-sm font-semibold text-white hover:bg-navy-800"
        >
          Filter
        </button>
        {(sp.q || sp.status) && (
          <Link href="/admin/products" className="h-9 px-2 text-sm text-muted-foreground hover:text-foreground">
            Clear
          </Link>
        )}
      </form>

      <div className="rounded-xl border bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Price</TableHead>
              <TableHead className="text-end">Stock</TableHead>
              <TableHead className="text-end">Sales</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No products match these filters.
                </TableCell>
              </TableRow>
            )}
            {result.items.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="block size-11"
                    aria-label={`Edit ${product.name}`}
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt=""
                        className="size-11 rounded-md border bg-muted object-cover"
                      />
                    ) : (
                      <span className="flex size-11 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                        <Package className="size-4" />
                      </span>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="text-sm font-semibold text-navy-950 hover:text-gold-600"
                  >
                    {product.name}
                  </Link>
                  <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.categoryName}
                    {product.subcategoryName ? ` · ${product.subcategoryName}` : ""}
                  </p>
                </TableCell>
                <TableCell>
                  <ProductStatusBadge status={product.status} />
                </TableCell>
                <TableCell className="text-end">
                  <p className="font-semibold">{formatMAD(product.priceMinor)}</p>
                  {product.compareAtPriceMinor !== null && product.compareAtPriceMinor > product.priceMinor && (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatMAD(product.compareAtPriceMinor)}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-end text-sm font-semibold">{product.stock}</TableCell>
                <TableCell className="text-end text-sm text-muted-foreground">{product.salesCount}</TableCell>
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
