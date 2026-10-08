import { db } from "@/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";

export interface ReviewDTO {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: Date;
  authorName: string;
  verified: boolean;
}

export async function getProductReviews(
  productId: string,
  page = 1,
  perPage = 10,
): Promise<{ items: ReviewDTO[]; total: number; page: number; pages: number; average: number }> {
  const where = { productId };

  const [total, reviews, aggregate] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (Math.max(1, page) - 1) * perPage,
      take: perPage,
      include: { user: { select: { name: true } } },
    }),
    db.review.aggregate({ where, _avg: { rating: true } }),
  ]);

  return {
    items: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      createdAt: review.createdAt,
      authorName: review.user.name || "Client",
      verified: true,
    })),
    total,
    page: Math.max(1, page),
    pages: Math.ceil(total / perPage),
    average: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
  };
}

async function recomputeProductRating(productId: string): Promise<void> {
  const aggregate = await db.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: true,
  });
  await db.product.update({
    where: { id: productId },
    data: {
      rating: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
      reviewCount: aggregate._count,
    },
  });
}

export interface CreateReviewInput {
  productId: string;
  userId: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
}

export async function createReview(input: CreateReviewInput): Promise<void> {
  const rating = Math.min(5, Math.max(1, Math.trunc(input.rating)));
  if (!Number.isFinite(rating)) {
    throw new ValidationError("Rating must be between 1 and 5", [
      { path: "rating", message: "Invalid rating" },
    ]);
  }

  const product = await db.product.findUnique({ where: { id: input.productId }, select: { id: true } });
  if (!product) throw new NotFoundError("Product not found");

  const existing = await db.review.findUnique({
    where: { productId_userId: { productId: input.productId, userId: input.userId } },
  });
  if (existing) {
    throw new ConflictError("You have already reviewed this product");
  }

  await db.review.create({
    data: {
      productId: input.productId,
      userId: input.userId,
      rating,
      title: input.title?.trim() || null,
      comment: input.comment?.trim() || null,
    },
  });

  await recomputeProductRating(input.productId);
}

export async function updateReview(
  reviewId: string,
  userId: string,
  input: { rating: number; title?: string | null; comment?: string | null },
): Promise<void> {
  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError("Review not found");
  if (review.userId !== userId) throw new ConflictError("You can only edit your own review");

  await db.review.update({
    where: { id: reviewId },
    data: {
      rating: Math.min(5, Math.max(1, Math.trunc(input.rating))),
      title: input.title?.trim() || null,
      comment: input.comment?.trim() || null,
    },
  });

  await recomputeProductRating(review.productId);
}

export async function deleteReview(reviewId: string): Promise<void> {
  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError("Review not found");
  await db.review.delete({ where: { id: reviewId } });
  await recomputeProductRating(review.productId);
}

export async function listReviewsAdmin(page = 1, perPage = 20) {
  const where = {};
  const [total, reviews] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (Math.max(1, page) - 1) * perPage,
      take: perPage,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { nameFr: true, slug: true } },
      },
    }),
  ]);

  return { items: reviews, total, page, pages: Math.ceil(total / perPage) };
}
