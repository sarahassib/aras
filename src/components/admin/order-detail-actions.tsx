"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from "@/lib/business-rules";
import { changeStatusAction, resendEmailAction, saveNotesAction } from "@/app/admin/(dashboard)/orders/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";

const LABELS: Record<OrderStatus, string> = {
  NEW: "New",
  CONFIRMED: "Confirm",
  PREPARING: "Mark preparing",
  SHIPPED: "Mark shipped",
  DELIVERED: "Mark delivered",
  CANCELLED: "Cancel order",
};

export function OrderDetailActions({
  orderId,
  currentStatus,
  initialNotes,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  initialNotes: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const transitions = ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];

  const setStatus = (to: OrderStatus) => {
    startTransition(async () => {
      const result = await changeStatusAction(orderId, to);
      if (result.ok) {
        toast.success(`Order moved to ${to}`);
      } else {
        toast.error(result.error ?? "Failed to update status");
      }
    });
  };

  const saveNotes = () => {
    startTransition(async () => {
      const result = await saveNotesAction(orderId, notes);
      if (result.ok) toast.success("Notes saved");
      else toast.error(result.error ?? "Failed to save notes");
    });
  };

  const resend = () => {
    startTransition(async () => {
      const result = await resendEmailAction(orderId);
      if (result.ok) toast.success("Email queued for delivery");
      else toast.error(result.error ?? "Failed to queue email");
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4 shadow-xs">
        <h2 className="mb-3 text-sm font-semibold text-navy-950">Move order forward</h2>
        {transitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No further transitions available from <strong>{currentStatus}</strong>.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {transitions.map((to) => (
              <Button
                key={to}
                size="sm"
                disabled={pending}
                variant={to === "CANCELLED" ? "destructive" : "default"}
                className={to === "CANCELLED" ? "" : "bg-navy-950 text-white hover:bg-navy-800"}
                onClick={() => setStatus(to)}
              >
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : LABELS[to]}
              </Button>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Every transition is recorded in the status history and triggers the matching customer e-mail.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-xs">
        <h2 className="mb-3 text-sm font-semibold text-navy-950">Internal notes</h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Visible to admins only…"
        />
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" disabled={pending} onClick={saveNotes} className="bg-navy-950 text-white hover:bg-navy-800">
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Save notes"}
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={resend}>
            <Send className="size-3.5" /> Resend status e-mail
          </Button>
        </div>
      </div>
    </div>
  );
}
