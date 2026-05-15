/**
 * Formats an ISO timestamp identically on the server and in the browser so
 * Client Components (e.g. profile tabs) do not hydration-mismatch on locale/TZ defaults.
 */
const communityTimestampFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

export function formatCommunityTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return communityTimestampFormatter.format(d);
}
