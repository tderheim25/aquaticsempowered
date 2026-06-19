import { checkoutSessionIdFromClientSecret } from "@/lib/stripe/checkoutSessionId";

export async function confirmCheckoutPayment(clientSecret: string | null | undefined): Promise<void> {
  if (!clientSecret) return;

  const sessionId = checkoutSessionIdFromClientSecret(clientSecret);
  const payload = sessionId ? { sessionId } : { clientSecret };

  try {
    await fetch("/api/stripe/sync-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-blocking; billing page self-heals on next load.
  }
}
