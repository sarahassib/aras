import type { NextRequest } from "next/server";
import { apiRoute, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { deleteBanner, updateBanner } from "@/services/banners";
import { bannerInputSchema } from "@/validation/catalog";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const input = await readBody(request, bannerInputSchema.partial());
    const banner = await updateBanner(id, input);
    return ok(banner);
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    await deleteBanner(id);
    return ok({ ok: true });
  });
}
