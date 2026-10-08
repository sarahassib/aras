"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setProductStockAction } from "@/app/admin/(dashboard)/products/actions";

export function StockInput({
  productId,
  stock,
  variantCount,
}: {
  productId: string;
  stock: number;
  variantCount: number;
}) {
  const [value, setValue] = useState(String(stock));
  const [isPending, startTransition] = useTransition();

  if (variantCount > 0) {
    return (
      <span
        className="text-sm text-muted-foreground"
        title="This product uses variants — edit stock on the product page."
      >
        {stock}
      </span>
    );
  }

  const save = () => {
    const next = Math.max(0, Math.trunc(Number.parseInt(value, 10) || 0));
    if (next === stock) {
      setValue(String(stock));
      return;
    }
    startTransition(async () => {
      const result = await setProductStockAction(productId, next);
      if (result.ok) {
        toast.success(`Stock updated to ${next}`);
        setValue(String(next));
      } else {
        toast.error(result.error ?? "Failed to update stock");
        setValue(String(stock));
      }
    });
  };

  return (
    <input
      type="number"
      min={0}
      value={value}
      disabled={isPending}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="w-20 rounded-md border border-input bg-background px-2 py-1 text-end text-sm disabled:opacity-60"
      aria-label="Stock"
    />
  );
}
