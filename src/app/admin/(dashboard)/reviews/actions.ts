"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { updateReview, deleteReview } from "@/services/reviews";

export async function updateReviewAction(input: {
  reviewId: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await updateReview(input.reviewId, input.userId, {
      rating: input.rating,
      title: input.title,
      comment: input.comment,
    });
    revalidatePath("/admin/reviews");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update review" };
  }
}

export async function deleteReviewAction(reviewId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    await deleteReview(reviewId);
    revalidatePath("/admin/reviews");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to delete review" };
  }
}
