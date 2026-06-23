/** Stripe embedded checkout client secrets are `{session_id}_secret_{random}`. */
export function checkoutSessionIdFromClientSecret(clientSecret: string): string | null {
  const marker = "_secret_";
  const index = clientSecret.indexOf(marker);
  if (index <= 0) return null;
  return clientSecret.slice(0, index);
}
