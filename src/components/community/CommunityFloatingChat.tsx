"use client";

import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  Fab,
  IconButton,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { createClient, isSupabaseAuthTransportError } from "@/lib/supabase/client";
import { totalUnread } from "@/lib/community/dmUnread";
import { formatCommunityTimestamp } from "@/lib/community/formatCommunityTimestamp";
import type { Database } from "@/types/database";

export type CommunityChatContact = {
  id: string;
  full_name: string | null;
  email: string;
  unreadCount?: number;
};

type DMRow = Database["public"]["Tables"]["community_direct_messages"]["Row"];

const MAX_BODY = 2000;

const SESSION_EXPIRED_MSG =
  "Your sign-in session expired or could not reach Supabase. Sign out, then sign in again.";

function formatChatError(message: string | undefined, fallback: string) {
  if (isSupabaseAuthTransportError(message)) return SESSION_EXPIRED_MSG;
  return message || fallback;
}

function contactLabel(c: CommunityChatContact) {
  return c.full_name?.trim() || c.email.split("@")[0] || "Member";
}

function contactInitials(c: CommunityChatContact) {
  return contactLabel(c).slice(0, 2).toUpperCase();
}

function pairFilter(viewerId: string, peerId: string) {
  return `and(sender_id.eq.${viewerId},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${viewerId})`;
}

/**
 * Network-only DM: FAB opens a panel with contacts (mutual network) on the left and the thread on the right.
 * Requires migration `0012_community_direct_messages.sql` and Realtime enabled on that table.
 */
export function CommunityFloatingChat({
  viewerId,
  contacts,
  initialUnreadByPeer = {},
}: {
  viewerId: string;
  contacts: CommunityChatContact[];
  initialUnreadByPeer?: Record<string, number>;
}) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up("md"));
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DMRow[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const openRef = useRef(false);
  const contactsRef = useRef(contacts);
  const supabase = useMemo(() => createClient(), []);
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [unreadByPeer, setUnreadByPeer] = useState<Record<string, number>>(() => {
    const seed: Record<string, number> = { ...initialUnreadByPeer };
    for (const c of contacts) {
      if (seed[c.id] === undefined) seed[c.id] = c.unreadCount ?? 0;
    }
    return seed;
  });
  const [desktopAlerts, setDesktopAlerts] = useState(false);

  const unreadTotal = useMemo(() => totalUnread(unreadByPeer), [unreadByPeer]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    setDesktopAlerts(Notification.permission === "granted");
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;
      setSessionOk(!error && !!data.session);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const markPeerRead = useCallback(
    async (peerId: string) => {
      const now = new Date().toISOString();
      const { error } = await supabase.from("community_dm_read_cursors").upsert(
        { user_id: viewerId, peer_id: peerId, last_read_at: now },
        { onConflict: "user_id,peer_id" }
      );
      if (error && process.env.NODE_ENV === "development") {
        console.warn("[CommunityFloatingChat] markPeerRead", error.message);
      }
      setUnreadByPeer((prev) => ({ ...prev, [peerId]: 0 }));
    },
    [supabase, viewerId]
  );

  const showDesktopNotification = useCallback((fromId: string, body: string) => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    const viewing = openRef.current && selectedIdRef.current === fromId;
    if (viewing && !document.hidden) return;

    const contact = contactsRef.current.find((c) => c.id === fromId);
    const name = contact ? contactLabel(contact) : "Network contact";
    const preview = body.length > 140 ? `${body.slice(0, 137)}…` : body;

    try {
      const n = new Notification(`New message from ${name}`, {
        body: preview,
        tag: `community-dm-${fromId}`,
      });
      n.onclick = () => {
        window.focus();
        setOpen(true);
        setSelectedId(fromId);
        n.close();
      };
    } catch {
      // ignore if notifications blocked
    }
  }, []);

  const enableDesktopAlerts = useCallback(async () => {
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setDesktopAlerts(result === "granted");
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useLayoutEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, selectedId, scrollToBottom]);

  const loadThread = useCallback(
    async (peerId: string) => {
      setLoadingThread(true);
      setLoadError(null);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        setLoadError(formatChatError(sessionError?.message, SESSION_EXPIRED_MSG));
        setMessages([]);
        setLoadingThread(false);
        setSessionOk(false);
        return;
      }

      const { data, error } = await supabase
        .from("community_direct_messages")
        .select("id, sender_id, recipient_id, body, created_at")
        .or(pairFilter(viewerId, peerId))
        .order("created_at", { ascending: true })
        .limit(300);

      if (error) {
        const msg = /PGRST205|schema cache|not find the table/i.test(error.message ?? "")
          ? "Chat is not available yet. Apply migration 0012_community_direct_messages.sql on Supabase."
          : formatChatError(error.message, "Could not load messages.");
        setLoadError(msg);
        setMessages([]);
      } else {
        setMessages((data ?? []) as DMRow[]);
        await markPeerRead(peerId);
      }
      setLoadingThread(false);
    },
    [viewerId, supabase, markPeerRead]
  );

  useEffect(() => {
    if (!open || !selectedId || sessionOk !== true) return;
    void loadThread(selectedId);
  }, [open, selectedId, sessionOk, loadThread]);

  const appendIfCurrentThread = useCallback(
    (row: DMRow) => {
      const peer = selectedIdRef.current;
      if (!peer) return;
      const a = row.sender_id;
      const b = row.recipient_id;
      if (![a, b].includes(viewerId) || ![a, b].includes(peer)) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === row.id)) return prev;
        return [...prev, row].sort((x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime());
      });
    },
    [viewerId]
  );

  const handleIncomingDm = useCallback(
    (row: DMRow) => {
      if (row.recipient_id !== viewerId) return;
      const fromId = row.sender_id;
      const viewing = openRef.current && selectedIdRef.current === fromId;

      if (viewing) {
        appendIfCurrentThread(row);
        void markPeerRead(fromId);
        return;
      }

      setUnreadByPeer((prev) => ({ ...prev, [fromId]: (prev[fromId] ?? 0) + 1 }));
      showDesktopNotification(fromId, row.body);
    },
    [viewerId, appendIfCurrentThread, markPeerRead, showDesktopNotification]
  );

  useEffect(() => {
    if (sessionOk !== true) return;
    const channel = supabase
      .channel(`community-dm-notify:${viewerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_direct_messages",
          filter: `recipient_id=eq.${viewerId}`,
        },
        (payload) => handleIncomingDm(payload.new as DMRow)
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" && err && process.env.NODE_ENV === "development") {
          console.warn("[CommunityFloatingChat] realtime", err.message);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionOk, viewerId, handleIncomingDm, supabase]);

  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const ua = unreadByPeer[a.id] ?? 0;
      const ub = unreadByPeer[b.id] ?? 0;
      if (ua !== ub) return ub - ua;
      return contactLabel(a).localeCompare(contactLabel(b));
    });
  }, [contacts, unreadByPeer]);

  const toggle = useCallback(() => {
    setOpen((v) => !v);
    if (open) {
      setSendError(null);
      setLoadError(null);
    }
  }, [open]);

  const sendMessage = useCallback(async () => {
    const peerId = selectedId;
    const body = draft.trim();
    if (!peerId || !body || sending) return;
    if (body.length > MAX_BODY) {
      setSendError(`Message must be ${MAX_BODY} characters or fewer.`);
      return;
    }
    setSending(true);
    setSendError(null);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      setSendError(formatChatError(sessionError?.message, SESSION_EXPIRED_MSG));
      setSessionOk(false);
      setSending(false);
      return;
    }

    const { data, error } = await supabase
      .from("community_direct_messages")
      .insert({
        sender_id: viewerId,
        recipient_id: peerId,
        body,
      })
      .select("id, sender_id, recipient_id, body, created_at")
      .single();

    if (error) {
      const msg = /PGRST205|schema cache|not find the table/i.test(error.message ?? "")
        ? "Chat tables are missing. Apply migration 0012 on Supabase."
        : /row-level security|RLS|42501/i.test(error.message ?? "")
          ? "You can only message people in your mutual network. Confirm you are connected, then try again."
          : formatChatError(error.message, "Could not send.");
      setSendError(msg);
    } else if (data) {
      setDraft("");
      appendIfCurrentThread(data as DMRow);
    }
    setSending(false);
  }, [appendIfCurrentThread, draft, selectedId, sending, viewerId, supabase]);

  const bottom = mdUp ? 28 : 20;
  const right = mdUp ? 28 : 16;
  const selectedContact = contacts.find((c) => c.id === selectedId) ?? null;

  return (
    <Box
      sx={{
        position: "fixed",
        right,
        bottom,
        zIndex: (t) => t.zIndex.drawer + 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 1.5,
        pointerEvents: "none",
        "& > *": { pointerEvents: "auto" },
      }}
    >
      {open ? (
        <Paper
          elevation={8}
          sx={{
            width: "min(100vw - 24px, 640px)",
            height: "min(72vh, 560px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.25,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              flexShrink: 0,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Network chat
              {unreadTotal > 0 ? (
                <Typography component="span" variant="caption" sx={{ ml: 1, opacity: 0.9 }}>
                  ({unreadTotal} new)
                </Typography>
              ) : null}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {typeof window !== "undefined" && typeof Notification !== "undefined" && !desktopAlerts ? (
                <Tooltip title="Enable desktop alerts for new messages">
                  <IconButton
                    size="small"
                    onClick={() => void enableDesktopAlerts()}
                    aria-label="Enable desktop notifications"
                    sx={{ color: "inherit" }}
                  >
                    <NotificationsActiveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
              <IconButton size="small" onClick={toggle} aria-label="Close chat" sx={{ color: "inherit" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {sessionOk === false ? (
            <Alert severity="warning" sx={{ m: 2 }}>
              {SESSION_EXPIRED_MSG}{" "}
              <Link href="/login?next=/community" style={{ fontWeight: 600 }}>
                Sign in again
              </Link>
            </Alert>
          ) : null}

          <Box sx={{ display: "flex", flex: 1, minHeight: 0, opacity: sessionOk === false ? 0.5 : 1 }}>
            <Box
              sx={{
                width: { xs: 112, sm: 200 },
                flexShrink: 0,
                borderRight: 1,
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
                bgcolor: "action.hover",
              }}
            >
              <Typography variant="caption" sx={{ px: 1.5, py: 1, fontWeight: 700, color: "text.secondary" }}>
                Contacts
              </Typography>
              <Box sx={{ flex: 1, overflow: "auto" }}>
                {contacts.length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, display: "block" }}>
                    No network connections yet. Accept a connection request to chat.
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {sortedContacts.map((c) => {
                      const unread = unreadByPeer[c.id] ?? 0;
                      return (
                        <ListItemButton
                          key={c.id}
                          selected={selectedId === c.id}
                          onClick={() => {
                            setSelectedId(c.id);
                            setSendError(null);
                            setLoadError(null);
                            void markPeerRead(c.id);
                          }}
                          sx={{ alignItems: "flex-start", py: 1 }}
                        >
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            <Badge
                              badgeContent={unread > 0 ? (unread > 9 ? "9+" : unread) : undefined}
                              color="error"
                              overlap="circular"
                              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            >
                              <Avatar sx={{ width: 32, height: 32, fontSize: "0.75rem" }}>{contactInitials(c)}</Avatar>
                            </Badge>
                          </ListItemAvatar>
                          <ListItemText
                            primary={contactLabel(c)}
                            primaryTypographyProps={{
                              variant: "body2",
                              noWrap: true,
                              sx: { fontWeight: unread > 0 ? 800 : 600 },
                            }}
                            secondary={unread > 0 ? `${unread} new message${unread === 1 ? "" : "s"}` : c.email}
                            secondaryTypographyProps={{
                              variant: "caption",
                              noWrap: true,
                              color: unread > 0 ? "error.main" : "text.secondary",
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                )}
              </Box>
            </Box>

            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, bgcolor: "background.paper" }}>
              {!selectedId ? (
                <Box sx={{ p: 2, flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Select a contact to start chatting. Only mutual network connections appear here.
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {selectedContact ? contactLabel(selectedContact) : "Chat"}
                    </Typography>
                    {selectedContact ? (
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {selectedContact.email}
                      </Typography>
                    ) : null}
                  </Box>

                  <Box sx={{ flex: 1, overflow: "auto", px: 2, py: 1 }}>
                    {loadError ? (
                      <Alert severity="error" sx={{ mb: 1 }}>
                        {loadError}
                      </Alert>
                    ) : null}
                    {loadingThread ? (
                      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={28} />
                      </Box>
                    ) : (
                      <StackMessages messages={messages} viewerId={viewerId} />
                    )}
                    <div ref={messagesEndRef} />
                  </Box>

                  <Box sx={{ p: 1.5, borderTop: 1, borderColor: "divider", flexShrink: 0 }}>
                    {sendError ? (
                      <Alert severity="error" sx={{ mb: 1 }} onClose={() => setSendError(null)}>
                        {sendError}
                      </Alert>
                    ) : null}
                    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                      <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        size="small"
                        placeholder="Write a message…"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void sendMessage();
                          }
                        }}
                        inputProps={{ maxLength: MAX_BODY }}
                        disabled={contacts.length === 0 || sessionOk !== true}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        endIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                        onClick={() => void sendMessage()}
                        disabled={sending || !draft.trim() || contacts.length === 0 || sessionOk !== true}
                        sx={{ flexShrink: 0, mb: 0.25 }}
                      >
                        Send
                      </Button>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Paper>
      ) : null}

      <Tooltip
        title={
          open
            ? "Close chat"
            : unreadTotal > 0
              ? `Open network chat (${unreadTotal} new message${unreadTotal === 1 ? "" : "s"})`
              : "Open network chat"
        }
        placement="left"
      >
        <Box
          component="span"
          sx={{
            position: "relative",
            display: "inline-flex",
            verticalAlign: "middle",
          }}
        >
          <Fab
            color="primary"
            aria-expanded={open}
            aria-label={
              open
                ? "Close network chat"
                : unreadTotal > 0
                  ? `Open network chat, ${unreadTotal} unread`
                  : "Open network chat"
            }
            onClick={toggle}
            size="medium"
            sx={{ position: "relative", zIndex: 0 }}
          >
            {open ? <CloseIcon /> : <ChatIcon />}
          </Fab>
          {unreadTotal > 0 ? (
            <Box
              component="span"
              aria-hidden
              sx={{
                position: "absolute",
                top: -4,
                right: -4,
                zIndex: 2,
                minWidth: 22,
                height: 22,
                px: 0.75,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                bgcolor: "error.main",
                color: "error.contrastText",
                fontSize: "0.75rem",
                fontWeight: 700,
                lineHeight: 1,
                boxShadow: (t) => `0 0 0 2px ${t.palette.background.paper}`,
                pointerEvents: "none",
              }}
            >
              {unreadTotal > 99 ? "99+" : unreadTotal}
            </Box>
          ) : null}
        </Box>
      </Tooltip>
    </Box>
  );
}

function StackMessages({ messages, viewerId }: { messages: DMRow[]; viewerId: string }) {
  if (messages.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        No messages yet. Say hello.
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {messages.map((m) => {
        const mine = m.sender_id === viewerId;
        return (
          <Box
            key={m.id}
            sx={{
              alignSelf: mine ? "flex-end" : "flex-start",
              maxWidth: "88%",
              px: 1.5,
              py: 1,
              borderRadius: 2,
              bgcolor: mine ? "primary.main" : "action.hover",
              color: mine ? "primary.contrastText" : "text.primary",
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {m.body}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 0.5,
                opacity: 0.85,
                color: mine ? "primary.contrastText" : "text.secondary",
              }}
            >
              {formatCommunityTimestamp(m.created_at)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
