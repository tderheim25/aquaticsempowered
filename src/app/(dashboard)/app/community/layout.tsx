import type { ReactNode } from "react";

import { CommunityFloatingChat, type CommunityChatContact } from "@/components/community/CommunityFloatingChat";
import { buildUnreadCountByPeer } from "@/lib/community/dmUnread";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { requireViewAccess } from "@/lib/auth/viewPermissions";
import { createClient } from "@/lib/supabase/server";

function sortContacts(a: CommunityChatContact, b: CommunityChatContact) {
  const ua = a.unreadCount ?? 0;
  const ub = b.unreadCount ?? 0;
  if (ua !== ub) return ub - ua;
  const la = (a.full_name?.trim() || a.email).toLowerCase();
  const lb = (b.full_name?.trim() || b.email).toLowerCase();
  return la.localeCompare(lb);
}

export default async function CommunityLayout({ children }: { children: ReactNode }) {
  await requireViewAccess("community");
  const me = await requireProfileForApp();
  const supabase = await createClient();

  const { data: edgeRows } = await supabase
    .from("community_network_edges")
    .select("user_a, user_b")
    .or(`user_a.eq.${me.id},user_b.eq.${me.id}`);

  const peerIds = [...new Set((edgeRows ?? []).map((e) => (e.user_a === me.id ? e.user_b : e.user_a)))];

  let unreadByPeer: Record<string, number> = {};
  if (peerIds.length > 0) {
    const { data: cursors } = await supabase
      .from("community_dm_read_cursors")
      .select("peer_id, last_read_at")
      .eq("user_id", me.id);

    const { data: incoming } = await supabase
      .from("community_direct_messages")
      .select("sender_id, created_at")
      .eq("recipient_id", me.id)
      .in("sender_id", peerIds);

    unreadByPeer = buildUnreadCountByPeer(incoming ?? [], cursors ?? []);
  }

  const { data: userRows } =
    peerIds.length > 0
      ? await supabase.from("users").select("id, full_name, email").in("id", peerIds)
      : { data: [] as { id: string; full_name: string | null; email: string }[] };

  const contacts: CommunityChatContact[] = [...(userRows ?? [])]
    .map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      unreadCount: unreadByPeer[u.id] ?? 0,
    }))
    .sort(sortContacts);

  return (
    <>
      {children}
      <CommunityFloatingChat viewerId={me.id} contacts={contacts} initialUnreadByPeer={unreadByPeer} />
    </>
  );
}
