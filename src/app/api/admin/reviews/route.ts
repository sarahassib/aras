import type { NextRequest } from "next/server";
import { apiRoute, noContent, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { deleteReview, listReviewsAdmin } from "@/services/reviews";
import { intQuery } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const page = intQuery(request.nextUrl.searchParams.get("page"), 1);
    const perPage = intQuery(request.nextUrl.searchParams.get("perPage"), 20);
    const result = await listReviewsAdmin(page, perPage);
    return ok(result);
  });
}

export async function DELETE(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return ok({ ok: false }, { status: 400 });
    await deleteReview(id);
    return noContent();
  });
}
