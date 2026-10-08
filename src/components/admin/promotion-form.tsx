"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Promotion, PromotionTarget } from "@/generated/prisma/client";
import type { PromotionInput } from "@/services/promotions";
import { savePromotionAction } from "@/app/admin/(dashboard)/promotions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export interface PromotionTargetOption {
  id: string;
  label: string;
}

const PROMOTION_TARGETS: PromotionTarget[] = ["PRODUCT", "CATEGORY"];

function toInputValue(value: Date | null): string {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function PromotionForm({
  promotion,
  categories,
  products,
}: {
  promotion: Promotion | null;
  categories: PromotionTargetOption[];
  products: PromotionTargetOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(promotion?.name ?? "");
  const [type, setType] = useState<PromotionTarget>(promotion?.type ?? "PRODUCT");
  const [targetId, setTargetId] = useState(promotion?.targetId ?? "");
  const [percent, setPercent] = useState(promotion ? String(promotion.percent) : "");
  const [startsAt, setStartsAt] = useState(toInputValue(promotion?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toInputValue(promotion?.endsAt ?? null));
  const [sortOrder, setSortOrder] = useState(String(promotion?.sortOrder ?? 0));
  const [active, setActive] = useState(promotion?.active ?? true);

  const options = type === "CATEGORY" ? categories : products;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Promotion name is required");
      return;
    }
    if (!targetId) {
      toast.error("Select a target for this promotion");
      return;
    }
    const parsedPercent = Number.parseInt(percent, 10);
    if (!Number.isFinite(parsedPercent) || parsedPercent < 1 || parsedPercent > 99) {
      toast.error("Discount must be between 1 and 99 percent");
      return;
    }

    const input: PromotionInput = {
      name: name.trim(),
      type,
      targetId,
      percent: parsedPercent,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      sortOrder: Number.parseInt(sortOrder, 10) || 0,
      active,
    };

    startTransition(async () => {
      const result = await savePromotionAction(promotion?.id ?? null, input);
      if (result.ok) {
        toast.success(promotion ? "Promotion updated" : "Promotion created");
        router.push("/admin/promotions");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save promotion");
      }
    });
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white p-6 shadow-xs">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="promotion-name">Name</Label>
          <Input
            id="promotion-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Summer sale"
          />
          <p className="text-xs text-muted-foreground">Internal label shown in this list.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="promotion-type">Apply to</Label>
          <Select
            value={type}
            onValueChange={(selected) => {
              setType(selected as PromotionTarget);
              setTargetId("");
            }}
          >
            <SelectTrigger id="promotion-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROMOTION_TARGETS.map((target) => (
                <SelectItem key={target} value={target}>
                  {target === "PRODUCT" ? "A product" : "A category"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="promotion-target">
            {type === "CATEGORY" ? "Category" : "Product"}
          </Label>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger id="promotion-target" className="w-full">
              <SelectValue placeholder="Select a target" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {type === "CATEGORY"
              ? "Every product in the category gets the discount."
              : "Products are listed by most recent update."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="promotion-percent">Discount (%)</Label>
          <Input
            id="promotion-percent"
            type="number"
            min={1}
            max={99}
            value={percent}
            onChange={(event) => setPercent(event.target.value)}
            placeholder="20"
          />
          <p className="text-xs text-muted-foreground">
            Percentage taken off the product price, between 1 and 99.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="promotion-starts">Starts at</Label>
          <Input
            id="promotion-starts"
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Optional. Empty means immediate.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="promotion-ends">Ends at</Label>
          <Input
            id="promotion-ends"
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Optional. Empty means no end date.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="promotion-sort">Sort order</Label>
          <Input
            id="promotion-sort"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            placeholder="0"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
          <div>
            <Label htmlFor="promotion-active">Active</Label>
            <p className="text-xs text-muted-foreground">
              Inactive promotions are never applied.
            </p>
          </div>
          <Switch id="promotion-active" checked={active} onCheckedChange={setActive} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="bg-navy-950 text-white hover:bg-navy-800"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : promotion ? (
            "Save changes"
          ) : (
            "Create promotion"
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => router.push("/admin/promotions")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
