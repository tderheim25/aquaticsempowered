/** Count inbound DMs per sender that are newer than the read cursor for that peer. */
export function buildUnreadCountByPeer(
  incoming: { sender_id: string; created_at: string }[],
  cursors: { peer_id: string; last_read_at: string }[]
): Record<string, number> {
  const cursorByPeer = new Map(cursors.map((c) => [c.peer_id, c.last_read_at]));
  const counts: Record<string, number> = {};
  for (const m of incoming) {
    const lastRead = cursorByPeer.get(m.sender_id);
    if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
      counts[m.sender_id] = (counts[m.sender_id] ?? 0) + 1;
    }
  }
  return counts;
}

export function totalUnread(counts: Record<string, number>) {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}
