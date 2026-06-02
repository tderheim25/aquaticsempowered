import { redirect } from "next/navigation";

import { accountSettingsPath } from "@/lib/profile/paths";

export const metadata = {
  title: "Account settings | Aquatics Empowered",
};

/** Legacy URL — account settings live at `/app/account`. */
export default async function LegacyProfileRedirect({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  redirect(accountSettingsPath(status));
}
