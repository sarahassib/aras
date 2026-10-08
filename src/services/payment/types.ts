import type { Locale } from "@/lib/business-rules";

export interface CheckoutRequest {
  orderId: string;
  orderNumber: string;
  amountMinor: number;
  currency: string;
  /** Where the gateway sends the customer back (success page). */
  returnUrl: string;
  locale: Locale;
}

export interface CheckoutResponse {
  provider: string;
  checkoutUrl: string | null;
  providerReference: string | null;
}

export interface PaymentProvider {
  name: string;
  /** True when the provider can redirect the customer to a hosted page. */
  supportsRedirect: boolean;
  createCheckout(request: CheckoutRequest): Promise<CheckoutResponse>;
}

export interface WebhookVerification {
  ok: boolean;
  reason?: string;
}
