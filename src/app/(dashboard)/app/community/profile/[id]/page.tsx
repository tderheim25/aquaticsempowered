import { redirect } from "next/navigation";

import { communityProfilePath } from "@/lib/profile/paths";

/** Legacy dashboard URL — profiles live on `/community` with the marketing shell. */
export default async function LegacyCommunityProfileRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; tab?: string; edit?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const base = communityProfilePath(id);
  const qs = new URLSearchParams();
  if (query.status) qs.set("status", query.status);
  if (query.tab) qs.set("tab", query.tab);
  if (query.edit) qs.set("edit", query.edit);
  const suffix = qs.toString();
  redirect(suffix ? `${base}?${suffix}` : base);
}
