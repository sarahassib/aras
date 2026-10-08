"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductSortKey } from "@/services/products";

const SORT_KEYS: ProductSortKey[] = [
  "newest",
  "popular",
  "rating",
  "price_asc",
  "price_desc",
];

export function CatalogToolbar({
  locale,
  sort,
}: {
  locale: string;
  sort: ProductSortKey;
}) {
  const t = useTranslations("catalog");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") params.delete("sort");
    else params.set("sort", value);
    params.delete("page");
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-3">
      <Select value={sort} onValueChange={onSort}>
        <SelectTrigger className="w-44" aria-label={t("sort")} lang={locale}>
          <SelectValue placeholder={t("sort")} />
        </SelectTrigger>
        <SelectContent>
          {SORT_KEYS.map((key) => (
            <SelectItem key={key} value={key}>
              {t(`sortOptions.${key}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
