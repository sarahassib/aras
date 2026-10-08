"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { DiscountType } from "@/generated/prisma/client";
import type { CouponDTO, CouponInput } from "@/services/coupons";
import { saveCouponAction } from "@/app/admin/(dashboard)/coupons/actions";
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

const DISCOUNT_TYPES: DiscountType[] = ["PERCENT", "FIXED"];

function toInputValue(value: Date | null): string {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CouponForm({ coupon }: { coupon: CouponDTO | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState(coupon?.code ?? "");
  const [type, setType] = useState<DiscountType>(coupon?.type ?? "PERCENT");
  const [value, setValue] = useState(coupon ? String(coupon.value) : "");
  const [minOrder, setMinOrder] = useState(
    coupon && coupon.minOrderAmountMinor !== null ? String(coupon.minOrderAmountMinor) : "",
  );
  const [maxUses, setMaxUses] = useState(
    coupon && coupon.maxUses !== null ? String(coupon.maxUses) : "",
  );
  const [startsAt, setStartsAt] = useState(toInputValue(coupon?.startsAt ?? null));
  const [expiresAt, setExpiresAt] = useState(toInputValue(coupon?.expiresAt ?? null));
  const [active, setActive] = useState(coupon?.active ?? true);

  const parseOptionalNumber = (raw: string, label: string): number | null | undefined => {
    if (!raw.trim()) return null;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      toast.error(`${label} must be a positive number`);
      return undefined;
    }
    return parsed;
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.trim().length < 3) {
      toast.error("Code must be at least 3 characters");
      return;
    }
    const parsedValue = Number.parseInt(value, 10);
    if (!Number.isFinite(parsedValue) || parsedValue < 1) {
      toast.error("Value must be a positive number");
      return;
    }
    if (type === "PERCENT" && parsedValue > 100) {
      toast.error("Percentage cannot exceed 100");
      return;
    }
    const minOrderAmountMinor = parseOptionalNumber(minOrder, "Minimum order");
    if (minOrderAmountMinor === undefined) return;
    const maxUsesValue = parseOptionalNumber(maxUses, "Max uses");
    if (maxUsesValue === undefined) return;

    const input: CouponInput = {
      code: code.trim().toUpperCase(),
      type,
      value: parsedValue,
      minOrderAmountMinor,
      maxUses: maxUsesValue,
      startsAt: startsAt ? new Date(startsAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      active,
    };

    startTransition(async () => {
      const result = await saveCouponAction(coupon?.id ?? null, input);
      if (result.ok) {
        toast.success(coupon ? "Coupon updated" : "Coupon created");
        router.push("/admin/coupons");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to save coupon");
      }
    });
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white p-6 shadow-xs">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="coupon-code">Code</Label>
          <Input
            id="coupon-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="WELCOME10"
          />
          <p className="text-xs text-muted-foreground">
            Letters, numbers, dashes and underscores. Stored in uppercase.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coupon-type">Discount type</Label>
          <Select
            value={type}
            onValueChange={(selected) => setType(selected as DiscountType)}
          >
            <SelectTrigger id="coupon-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISCOUNT_TYPES.map((discountType) => (
                <SelectItem key={discountType} value={discountType}>
                  {discountType === "PERCENT" ? "Percent of order" : "Fixed amount"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coupon-value">
            {type === "PERCENT" ? "Value (%)" : "Value (centimes)"}
          </Label>
          <Input
            id="coupon-value"
            type="number"
            min={1}
            max={type === "PERCENT" ? 100 : undefined}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={type === "PERCENT" ? "10" : "5000"}
          />
          <p className="text-xs text-muted-foreground">
            {type === "PERCENT"
              ? "Percentage taken off the order subtotal."
              : "Fixed discount stored in centimes (5000 = 50 DH)."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coupon-min-order">Minimum order (centimes)</Label>
          <Input
            id="coupon-min-order"
            type="number"
            min={0}
            value={minOrder}
            onChange={(event) => setMinOrder(event.target.value)}
            placeholder="Leave empty for no minimum"
          />
          <p className="text-xs text-muted-foreground">
            Optional. Stored in centimes (20000 = 200 DH).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coupon-max-uses">Max uses</Label>
          <Input
            id="coupon-max-uses"
            type="number"
            min={1}
            value={maxUses}
            onChange={(event) => setMaxUses(event.target.value)}
            placeholder="Unlimited"
          />
          <p className="text-xs text-muted-foreground">
            Optional. Leave empty for unlimited redemptions.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coupon-starts">Starts at</Label>
          <Input
            id="coupon-starts"
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Optional. Empty means immediate.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coupon-expires">Expires at</Label>
          <Input
            id="coupon-expires"
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Optional. Empty means never expires.</p>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
          <div>
            <Label htmlFor="coupon-active">Active</Label>
            <p className="text-xs text-muted-foreground">
              Inactive coupons are rejected at checkout.
            </p>
          </div>
          <Switch id="coupon-active" checked={active} onCheckedChange={setActive} />
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
          ) : coupon ? (
            "Save changes"
          ) : (
            "Create coupon"
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => router.push("/admin/coupons")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
