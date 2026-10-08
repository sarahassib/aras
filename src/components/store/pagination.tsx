import { Link } from "@/i18n/navigation";
import { buildQuery, type QueryValue } from "./query";

export function Pagination({
  locale,
  page,
  pages,
  searchParams,
  label,
}: {
  locale: string;
  page: number;
  pages: number;
  searchParams: Record<string, QueryValue>;
  label: { prev: string; next: string };
}) {
  if (pages <= 1) return null;

  const pageHref = (p: number) =>
    `/catalog${buildQuery(searchParams, { page: p <= 1 ? undefined : String(p) })}`;

  const window: number[] = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end = Math.min(pages, start + 4);
  for (let p = start; p <= end; p++) window.push(p);

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-1.5"
      aria-label={`page ${locale}`}
    >
      {page > 1 && (
        <Link
          href={pageHref(page - 1)}
          className="rounded-md border px-3 py-2 text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          {label.prev}
        </Link>
      )}
      {window.map((p) => (
        <Link
          key={p}
          href={pageHref(p)}
          className={`min-w-9 rounded-md border px-3 py-2 text-center text-sm ${
            p === page
              ? "border-navy-950 bg-navy-950 font-semibold text-white"
              : "text-muted-foreground hover:border-foreground hover:text-foreground"
          }`}
        >
          {p}
        </Link>
      ))}
      {page < pages && (
        <Link
          href={pageHref(page + 1)}
          className="rounded-md border px-3 py-2 text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          {label.next}
        </Link>
      )}
    </nav>
  );
}
