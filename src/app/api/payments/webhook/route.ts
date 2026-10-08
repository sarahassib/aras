import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiRoute, ok } from "@/lib/api";
import { UnauthorizedError, ValidationError, NotFoundError } from "@/lib/errors";
import { verifyWebhookSignature } from "@/services/payment";
import { getOrderByNumber, markPaymentFailed, markPaymentPaid } from "@/services/orders";

export const runtime = "nodejs";

const webhookSchema = z.object({
  orderNumber: z.string().trim().min(3).max(60),
  status: z.enum(["PAID", "FAILED"]),
  reference: z.string().trim().max(200).nullish(),
});

/**
 * Gateway → ARAS payment webhook.
 * Header `x-aras-signature` must be HMAC-SHA256(rawBody, PAYMENT_WEBHOOK_SECRET)
 * in hex. Fails closed when no secret is configured.
 */
export async function POST(request: NextRequest) {
  return apiRoute(async () => {
    const rawBody = await request.text();
    const signature = request.headers.get("x-aras-signature");

    const verification = verifyWebhookSignature(rawBody, signature);
    if (!verification.ok) {
      throw new UnauthorizedError(`Webhook rejected: ${verification.reason}`);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new ValidationError("Invalid webhook payload", [
        { path: "body", message: "Expected JSON" },
      ]);
    }

    const parsed = webhookSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ValidationError("Invalid webhook payload", [
        { path: "body", message: "orderNumber and status are required" },
      ]);
    }

    const order = await getOrderByNumber(parsed.data.orderNumber);
    if (!order) throw new NotFoundError("Order not found");

    if (parsed.data.status === "PAID") {
      await markPaymentPaid(order.id, parsed.data.reference ?? null);
    } else {
      await markPaymentFailed(order.id);
    }

    return ok({ received: true });
  });
}
