"use client";

import Link from "next/link";
import type { Promotion } from "@/generated/prisma/client";
import { deletePromotionAction } from "@/app/admin/(dashboard)/promotions/actions";
import { DeleteConfirmButton } from "@/components/admin/delete-confirm-button";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export function PromotionRowActions({ promotion }: { promotion: Promotion }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        asChild
        variant="outline"
        size="icon"
        className="size-8"
        aria-label={`Edit ${promotion.name}`}
      >
        <Link href={`/admin/promotions/${promotion.id}`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
      <DeleteConfirmButton
        message={`Delete the promotion “${promotion.name}”? This cannot be undone.`}
        successMessage="Promotion deleted"
        onConfirm={() => deletePromotionAction(promotion.id)}
      />
    </div>
  );
}
