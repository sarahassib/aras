"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { DeliveryZoneDTO, DeliveryZoneInput } from "@/services/delivery";
import {
  saveDeliveryZoneAction,
  deleteDeliveryZoneAction,
} from "@/app/admin/(dashboard)/delivery/actions";
import { formatAmount, parseAmountToMinor } from "@/lib/money";
import { DeleteConfirmButton } from "@/components/admin/delete-confirm-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Pencil, Plus } from "lucide-react";

function ZoneForm({
  zone,
  onSaved,
}: {
  zone?: DeliveryZoneDTO;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [city, setCity] = useState(zone?.city ?? "");
  const [fee, setFee] = useState(zone ? formatAmount(zone.feeMinor) : "");
  const [active, setActive] = useState(zone?.active ?? true);
  const [isDefault, setIsDefault] = useState(zone?.isDefault ?? false);
  const [sortOrder, setSortOrder] = useState(String(zone?.sortOrder ?? 0));

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!city.trim()) {
      toast.error("City is required");
      return;
    }
    if (!fee.trim()) {
      toast.error("Delivery fee is required");
      return;
    }
    let feeMinor: number;
    try {
      feeMinor = parseAmountToMinor(fee);
    } catch {
      toast.error("Enter a valid fee amount");
      return;
    }
    const input: DeliveryZoneInput = {
      city: city.trim(),
      feeMinor,
      active,
      isDefault,
      sortOrder: Number.parseInt(sortOrder, 10) || 0,
    };
    startTransition(async () => {
      const result = await saveDeliveryZoneAction(zone?.id ?? null, input);
      if (result.ok) {
        toast.success(zone ? "Delivery zone updated" : "Delivery zone created");
        onSaved();
      } else {
        toast.error(result.error ?? "Failed to save delivery zone");
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Casablanca"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee">Fee (DH)</Label>
          <div className="relative">
            <Input
              id="fee"
              value={fee}
              onChange={(event) => setFee(event.target.value)}
              inputMode="decimal"
              placeholder="30"
              className="pe-10"
            />
            <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-muted-foreground">
              DH
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="zone-sort">Sort order</Label>
          <Input
            id="zone-sort"
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
        <div>
          <Label htmlFor="zone-active">Active</Label>
          <p className="text-xs text-muted-foreground">Inactive zones never match a city.</p>
        </div>
        <Switch id="zone-active" checked={active} onCheckedChange={setActive} />
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
        <div>
          <Label htmlFor="zone-default">Default zone</Label>
          <p className="text-xs text-muted-foreground">
            Fallback for cities without a zone. Only one zone can be default.
          </p>
        </div>
        <Switch id="zone-default" checked={isDefault} onCheckedChange={setIsDefault} />
      </div>

      <DialogFooter>
        <Button type="submit" size="sm" disabled={pending} className="bg-navy-950 text-white hover:bg-navy-800">
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : zone ? "Save changes" : "Create zone"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ZoneDialog({ zone }: { zone?: DeliveryZoneDTO }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {zone ? (
          <Button variant="outline" size="sm" aria-label={`Edit ${zone.city}`}>
            <Pencil className="size-3.5" /> Edit
          </Button>
        ) : (
          <Button size="sm" className="bg-navy-950 text-white hover:bg-navy-800">
            <Plus className="size-4" /> New zone
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{zone ? `Edit ${zone.city}` : "New delivery zone"}</DialogTitle>
          <DialogDescription>
            Fees are stored in centimes and shown in dirhams.
          </DialogDescription>
        </DialogHeader>
        <ZoneForm zone={zone} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function NewDeliveryZoneButton() {
  return <ZoneDialog />;
}

export function DeliveryZoneRowActions({ zone }: { zone: DeliveryZoneDTO }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <ZoneDialog zone={zone} />
      <DeleteConfirmButton
        message={`Delete the delivery zone for "${zone.city}"?`}
        successMessage="Delivery zone deleted"
        onConfirm={() => deleteDeliveryZoneAction(zone.id)}
      />
    </div>
  );
}
