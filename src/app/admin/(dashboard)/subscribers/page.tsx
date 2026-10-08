import type { Metadata } from "next";
import Link from "next/link";
import { listSubscribers } from "@/services/newsletter";
import { ActiveBadge } from "@/components/admin/status-badge";
import { SubscriberRowActions } from "@/components/admin/subscriber-row-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Subscribers" };

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; active?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const activeOnly = sp.active === "1";
  const result = await listSubscribers(page, 50, activeOnly);

  const qs = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { active: sp.active, page: sp.page, ...next };
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
          <h1 className="text-2xl font-bold text-navy-950">Subscribers</h1>
          <p className="text-sm text-muted-foreground">{result.total} newsletter subscribers</p>
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3" action="/admin/subscribers" method="get">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
          <select
            name="active"
            defaultValue={activeOnly ? "1" : ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All subscribers</option>
            <option value="1">Active only</option>
          </select>
        </div>
        <button
          type="submit"
          className="h-9 rounded-md bg-navy-950 px-4 text-sm font-semibold text-white hover:bg-navy-800"
        >
          Filter
        </button>
        {activeOnly && (
          <Link href="/admin/subscribers" className="h-9 px-2 text-sm text-muted-foreground hover:text-foreground">
            Clear
          </Link>
        )}
      </form>

      <div className="rounded-xl border bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No subscribers yet.
                </TableCell>
              </TableRow>
            )}
            {result.items.map((subscriber) => (
              <TableRow key={subscriber.id}>
                <TableCell className="font-medium">{subscriber.email}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {subscriber.source ?? "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {subscriber.subscribedAt.toLocaleDateString("en-GB")}
                </TableCell>
                <TableCell>
                  <ActiveBadge active={subscriber.active} />
                </TableCell>
                <TableCell>
                  <SubscriberRowActions
                    subscriber={{
                      id: subscriber.id,
                      email: subscriber.email,
                      active: subscriber.active,
                    }}
                  />
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
