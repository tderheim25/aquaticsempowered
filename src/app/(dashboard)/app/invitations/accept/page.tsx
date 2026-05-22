import { redirect } from "next/navigation";

import { consumeInviteTokenAction } from "@/app/(dashboard)/app/invitations/actions";
import { getSessionUser } from "@/lib/auth/rbac";

export const metadata = {
  title: "Accept invitation | Aquatics Empowered",
};

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>;
}) {
  const { token, next } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : "/app";

  if (!token) {
    redirect(`${safeNext}?invite_status=invalid`);
  }

  const user = await getSessionUser();
  if (!user) {
    const back = `/app/invitations/accept?token=${encodeURIComponent(token)}`;
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }

  const res = await consumeInviteTokenAction(token);
  if (!res.ok) {
    redirect(`${safeNext}?invite_status=${encodeURIComponent(res.error ?? "error")}`);
  }

  const destination =
    res.kind === "technician" ? "/portal/queue" : safeNext;
  redirect(`${destination}?invite_status=accepted`);
}
