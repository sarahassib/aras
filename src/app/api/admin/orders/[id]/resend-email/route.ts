import type { NextRequest } from "next/server";
import { apiRoute, created, enforceRateLimit, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { resendOrderEmail } from "@/services/orders";
import { z } from "zod";
import { LOCALES } from "@/lib/business-rules";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const resendSchema = z.object({ locale: z.enum(LOCALES).default("fr") });

/** Re-sends the e-mail matching the order's current status. */
export async function POST(request: NextRequest, { params }: Params) {
  return apiRoute(async () => {
    await requireAdmin();
    enforceRateLimit(request, "admin:resend", 20, 60_000);
    const { id } = await params;
    const input = await readBody(request, resendSchema);
    await resendOrderEmail(id, input.locale);
    return created({ ok: true });
  });
}
