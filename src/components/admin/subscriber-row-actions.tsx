"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  setSubscriberActiveAction,
  deleteSubscriberAction,
} from "@/app/admin/(dashboard)/subscribers/actions";
import { DeleteConfirmButton } from "@/components/admin/delete-confirm-button";
import { Switch } from "@/components/ui/switch";

export function SubscriberRowActions({
  subscriber,
}: {
  subscriber: { id: string; email: string; active: boolean };
}) {
  const [pending, startTransition] = useTransition();

  const toggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await setSubscriberActiveAction(subscriber.id, checked);
      if (result.ok) {
        toast.success(checked ? "Subscriber activated" : "Subscriber deactivated");
      } else {
        toast.error(result.error ?? "Failed to update subscriber");
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-3">
      <Switch
        checked={subscriber.active}
        onCheckedChange={toggle}
        disabled={pending}
        aria-label={`Toggle ${subscriber.email}`}
      />
      <DeleteConfirmButton
        message={`Delete ${subscriber.email} from the newsletter list?`}
        successMessage="Subscriber deleted"
        onConfirm={() => deleteSubscriberAction(subscriber.id)}
      />
    </div>
  );
}
