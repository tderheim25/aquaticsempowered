import { redirect } from "next/navigation";

import { requireProfileForApp } from "@/lib/auth/rbac";
import { communityProfilePath } from "@/lib/profile/paths";

export const metadata = {
  title: "Profile | Aquatics Empowered",
};

/** Legacy route — profile lives on the community profile page. */
export default async function AccountProfileRedirect({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const profile = await requireProfileForApp();
  const { status } = await searchParams;
  redirect(communityProfilePath(profile.id, status));
}
