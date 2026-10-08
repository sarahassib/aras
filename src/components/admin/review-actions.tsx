"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { listReviewsAdmin } from "@/services/reviews";
import { updateReviewAction, deleteReviewAction } from "@/app/admin/(dashboard)/reviews/actions";
import { DeleteConfirmButton } from "@/components/admin/delete-confirm-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Pencil } from "lucide-react";

export type ReviewAdminRow = Awaited<ReturnType<typeof listReviewsAdmin>>["items"][number];

function EditReviewDialog({ review }: { review: ReviewAdminRow }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(review.title ?? "");
  const [comment, setComment] = useState(review.comment ?? "");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateReviewAction({
        reviewId: review.id,
        userId: review.userId,
        rating: review.rating,
        title: title.trim() || null,
        comment: comment.trim() || null,
      });
      if (result.ok) {
        toast.success("Review updated");
        setOpen(false);
      } else {
        toast.error(result.error ?? "Failed to update review");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="size-8" aria-label="Edit review">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit review</DialogTitle>
          <DialogDescription>
            Moderate the title and comment before they stay visible on the product page.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="review-title">Title</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-comment">Comment</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              placeholder="Review comment"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              size="sm"
              disabled={pending}
              className="bg-navy-950 text-white hover:bg-navy-800"
            >
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReviewRowActions({ review }: { review: ReviewAdminRow }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <EditReviewDialog review={review} />
      <DeleteConfirmButton
        message={`Delete the review by ${review.user.name || review.user.email} on ${review.product.nameFr}? Product rating will be recalculated.`}
        successMessage="Review deleted"
        onConfirm={() => deleteReviewAction(review.id)}
      />
    </div>
  );
}
