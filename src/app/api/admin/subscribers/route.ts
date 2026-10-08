import type { NextRequest } from "next/server";
import { apiRoute, intQuery, noContent, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { deleteSubscriber, listSubscribers, setSubscriberActive } from "@/services/newsletter";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const page = intQuery(request.nextUrl.searchParams.get("page"), 1);
    const perPage = intQuery(request.nextUrl.searchParams.get("perPage"), 50);
    const activeOnly = request.nextUrl.searchParams.get("active") === "1";
    const result = await listSubscribers(page, perPage, activeOnly);
    return ok(result);
  });
}

export async function PATCH(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const id = request.nextUrl.searchParams.get("id");
    const active = request.nextUrl.searchParams.get("active") === "1";
    if (!id) return ok({ ok: false }, { status: 400 });
    await setSubscriberActive(id, active);
    return ok({ ok: true });
  });
}

export async function DELETE(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return ok({ ok: false }, { status: 400 });
    await deleteSubscriber(id);
    return noContent();
  });
}
