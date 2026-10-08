import type { NextRequest } from "next/server";
import { apiRoute, ok } from "@/lib/api";
import { getDeliveryQuote } from "@/services/delivery";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return apiRoute(async () => {
    const city = request.nextUrl.searchParams.get("city") ?? "";
    const subtotalRaw = request.nextUrl.searchParams.get("subtotal") ?? "0";
    const subtotal = Math.max(0, Number.parseInt(subtotalRaw, 10) || 0);
    const quote = await getDeliveryQuote(subtotal, city);
    return ok(quote);
  });
}
