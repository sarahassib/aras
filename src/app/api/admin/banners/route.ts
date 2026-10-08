import type { NextRequest } from "next/server";
import { apiRoute, created, ok, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { createBanner, listBannersAdmin } from "@/services/banners";
import { bannerInputSchema } from "@/validation/catalog";

export const runtime = "nodejs";

export async function GET() {
  return apiRoute(async () => {
    await requireAdmin();
    const banners = await listBannersAdmin();
    return ok(banners);
  });
}

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    await requireAdmin();
    const input = await readBody(request, bannerInputSchema);
    const banner = await createBanner(input);
    return created(banner);
  });
}
