import type { NextRequest } from "next/server";
import { apiRoute, created, enforceRateLimit, readBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { createReview } from "@/services/reviews";
import { reviewCreateSchema } from "@/validation/common";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    enforceRateLimit(request, "reviews", 10, 60_000);
    const user = await getCurrentUser();
    const input = await readBody(request, reviewCreateSchema);

    await createReview({
      productId: input.productId,
      userId: user.id,
      rating: input.rating,
      title: input.title ?? null,
      comment: input.comment ?? null,
    });

    return created({ ok: true });
  });
}
