import type { Metadata } from "next";
import { listDeliveryZones } from "@/services/delivery";
import { formatMAD } from "@/lib/money";
import { ActiveBadge } from "@/components/admin/status-badge";
import { DeliveryZoneRowActions, NewDeliveryZoneButton } from "@/components/admin/delivery-zone-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Delivery zones" };

export default async function AdminDeliveryPage() {
  const zones = await listDeliveryZones();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Delivery zones</h1>
          <p className="text-sm text-muted-foreground">
            {zones.length} zone{zones.length === 1 ? "" : "s"} · fees are waived above the free-shipping threshold
          </p>
        </div>
        <NewDeliveryZoneButton />
      </div>

      <div className="rounded-xl border bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>City</TableHead>
              <TableHead className="text-end">Fee</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-end">Sort</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No delivery zones yet.
                </TableCell>
              </TableRow>
            )}
            {zones.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell className="font-medium">{zone.city}</TableCell>
                <TableCell className="text-end font-semibold">{formatMAD(zone.feeMinor)}</TableCell>
                <TableCell>
                  {zone.isDefault ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      Default
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <ActiveBadge active={zone.active} />
                </TableCell>
                <TableCell className="text-end text-sm text-muted-foreground">
                  {zone.sortOrder}
                </TableCell>
                <TableCell>
                  <DeliveryZoneRowActions zone={zone} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
