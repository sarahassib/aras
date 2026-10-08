import type { NextRequest } from "next/server";
import { apiRoute, created, enforceRateLimit, readBody } from "@/lib/api";
import { subscribeNewsletter } from "@/services/newsletter";
import { newsletterSchema } from "@/validation/common";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    enforceRateLimit(request, "newsletter", 5, 60_000);
    const input = await readBody(request, newsletterSchema);
    const result = await subscribeNewsletter(input.email, input.source ?? "footer");

    if (result === "INVALID") {
      return created({ status: "INVALID" as const });
    }
    return created({ status: result });
  });
}
