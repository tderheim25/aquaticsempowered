export type EmbeddedCheckoutRequest = {
  planCode: "essential" | "pro" | "enterprise";
  cadence?: "monthly" | "annual";
  flow?: "founder" | "self_serve";
  promoCode?: string;
};

export type EmbeddedCheckoutResponse = {
  clientSecret?: string;
  url?: string;
  error?: string;
  code?: string;
};

const AUTH_RETRY_DELAYS_MS = [400, 800, 1200];

export async function requestEmbeddedCheckout(
  body: EmbeddedCheckoutRequest,
  options?: { maxAuthRetries?: number; onBeforeRetry?: () => void },
): Promise<{ response: Response; data: EmbeddedCheckoutResponse }> {
  const maxAuthRetries = options?.maxAuthRetries ?? AUTH_RETRY_DELAYS_MS.length;
  let attempt = 0;

  while (true) {
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, embedded: true }),
    });

    let data: EmbeddedCheckoutResponse = {};
    try {
      data = (await response.json()) as EmbeddedCheckoutResponse;
    } catch {
      data = { error: response.statusText || "Unexpected server response" };
    }

    if (response.status !== 401 || attempt >= maxAuthRetries) {
      return { response, data };
    }

    options?.onBeforeRetry?.();
    await new Promise((resolve) => setTimeout(resolve, AUTH_RETRY_DELAYS_MS[attempt] ?? 1200));
    attempt += 1;
  }
}
