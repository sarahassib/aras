import { createHmac, timingSafeEqual } from "node:crypto";
import { AppErrorBuilder } from "@/lib/errors";
import type { CheckoutRequest, CheckoutResponse, PaymentProvider, WebhookVerification } from "./types";

/**
 * Cash on delivery — no redirect, no gateway. Payment is collected by the
 * courier; the payment record is marked PAID when the order is delivered.
 */
export const codProvider: PaymentProvider = {
  name: "COD",
  supportsRedirect: false,
  async createCheckout(): Promise<CheckoutResponse> {
    return { provider: "COD", checkoutUrl: null, providerReference: null };
  },
};

/**
 * Generic hosted-checkout provider (CMI, PayZone, CHQ, ClickPay…).
 *
 * Configured entirely through environment variables — no gateway SDK is
 * hard-wired. The provider redirects the customer to PAYMENT_PROVIDER_URL
 * with signed parameters, and calls our webhook on completion.
 *
 * Required env (when store.cardEnabled):
 *   PAYMENT_PROVIDER_URL   https://secure.gateway.ma/checkout
 *   PAYMENT_PROVIDER_ID    merchant / shop id
 *   PAYMENT_WEBHOOK_SECRET shared secret for request signing + webhook HMAC
 */
export function buildHostedCheckoutUrl(request: CheckoutRequest): string {
  const baseUrl = process.env.PAYMENT_PROVIDER_URL;
  const merchantId = process.env.PAYMENT_PROVIDER_ID;
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;

  if (!baseUrl || !merchantId || !secret) {
    throw AppErrorBuilder.payment(
      "Card payments are not configured yet. Please choose Cash on Delivery.",
    );
  }

  const params = new URLSearchParams({
    shop: merchantId,
    order: request.orderNumber,
    amount: String(request.amountMinor),
    currency: request.currency,
    success: request.returnUrl,
    cancel: request.returnUrl,
    lang: request.locale,
  });

  const signature = createHmac("sha256", secret).update(params.toString()).digest("hex");
  params.set("sig", signature);

  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}${params.toString()}`;
}

export const hostedCheckoutProvider: PaymentProvider = {
  name: "HOSTED",
  supportsRedirect: true,
  async createCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
    const checkoutUrl = buildHostedCheckoutUrl(request);
    return { provider: "HOSTED", checkoutUrl, providerReference: request.orderNumber };
  },
};

export function isHostedCheckoutConfigured(): boolean {
  return Boolean(
    process.env.PAYMENT_PROVIDER_URL &&
      process.env.PAYMENT_PROVIDER_ID &&
      process.env.PAYMENT_WEBHOOK_SECRET,
  );
}

// ── Webhook verification ──────────────────────────────────────

/**
 * Verifies an incoming gateway webhook:
 *   - header `x-aras-signature`: HMAC-SHA256(rawBody, PAYMENT_WEBHOOK_SECRET)
 *
 * Signature verification is constant-time. A missing secret means the
 * webhook endpoint is not configured → rejected (fail closed).
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): WebhookVerification {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) return { ok: false, reason: "Webhook secret not configured" };
  if (!signature) return { ok: false, reason: "Missing signature" };

  const expected = createHmac("sha256", secret).update(rawBody).digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "hex");
  } catch {
    return { ok: false, reason: "Malformed signature" };
  }

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { ok: false, reason: "Signature mismatch" };
  }

  return { ok: true };
}
