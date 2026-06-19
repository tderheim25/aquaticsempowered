import type Stripe from "stripe";

/** Stripe API version in use may omit subscription on Invoice typings; read safely from webhook payloads. */
export function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const raw = invoice as Stripe.Invoice & {
    subscription?: string | { id: string } | null;
  };
  if (!raw.subscription) return null;
  return typeof raw.subscription === "string" ? raw.subscription : raw.subscription.id;
}

export function embeddedCheckoutUiMode(): Stripe.Checkout.SessionCreateParams["ui_mode"] {
  return "embedded_page" as Stripe.Checkout.SessionCreateParams["ui_mode"];
}
