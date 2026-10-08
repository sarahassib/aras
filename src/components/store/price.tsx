import { formatMAD } from "@/lib/money";

export function Price({
  priceMinor,
  compareAtMinor,
  size = "md",
}: {
  priceMinor: number;
  compareAtMinor?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg"
      ? "text-2xl md:text-3xl"
      : size === "sm"
        ? "text-sm"
        : "text-base md:text-lg";
  return (
    <span className="flex flex-wrap items-baseline gap-2">
      <span className={`${sizeClass} font-semibold text-navy-950`}>
        {formatMAD(priceMinor)}
      </span>
      {compareAtMinor && compareAtMinor > priceMinor && (
        <span className="text-sm text-muted-foreground line-through">
          {formatMAD(compareAtMinor)}
        </span>
      )}
    </span>
  );
}
