"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ResolvedPostComment } from "@/components/community/CommunityPostCommentsBlock";
import { createClient } from "@/lib/supabase/client";

import type { SerializedFeedEngagement } from "./serializeFeedEngagement";

type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  moderation_status?: string;
};

type LikeRow = {
  post_id: string;
  user_id: string;
};

function cloneCommentsRecord(src: Record<string, ResolvedPostComment[]>) {
  const out: Record<string, ResolvedPostComment[]> = {};
  for (const [k, v] of Object.entries(src)) {
    out[k] = [...v];
  }
  return out;
}

async function resolveAuthor(authorId: string): Promise<{ author_display: string; author_email: string }> {
  const supabase = createClient();
  const { data } = await supabase.from("users").select("full_name, email").eq("id", authorId).maybeSingle();
  return {
    author_display: data?.full_name?.trim() ?? "",
    author_email: data?.email ?? "",
  };
}

function rowToComment(row: CommentRow, author: { author_display: string; author_email: string }): ResolvedPostComment {
  return {
    id: row.id,
    author_id: row.author_id,
    body: row.body,
    created_at: row.created_at,
    author_display: author.author_display,
    author_email: author.author_email,
  };
}

/** Live comments + likes for visible community posts (Realtime + local optimistic updates). */
export function useCommunityPostEngagement(
  enabled: boolean,
  postIds: string[],
  initial: SerializedFeedEngagement,
  viewerId: string | null
) {
  const postIdSet = useMemo(() => new Set(postIds), [postIds]);
  const [commentsByPost, setCommentsByPost] = useState(() => cloneCommentsRecord(initial.commentsByPost));
  const [likeCountByPost, setLikeCountByPost] = useState(() => ({ ...initial.likeCountByPost }));
  const [likedByMe, setLikedByMe] = useState(() => new Set(initial.likedByMe));
  const authorCache = useRef(new Map<string, { author_display: string; author_email: string }>());

  const initialKey = postIds.join(",");
  useEffect(() => {
    setCommentsByPost(cloneCommentsRecord(initial.commentsByPost));
    setLikeCountByPost({ ...initial.likeCountByPost });
    setLikedByMe(new Set(initial.likedByMe));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when visible posts change
  }, [initialKey]);

  const seedAuthorCache = useCallback((comments: Record<string, ResolvedPostComment[]>) => {
    for (const list of Object.values(comments)) {
      for (const c of list) {
        authorCache.current.set(c.author_id, {
          author_display: c.author_display,
          author_email: c.author_email,
        });
      }
    }
  }, []);

  useEffect(() => {
    seedAuthorCache(initial.commentsByPost);
  }, [initial.commentsByPost, seedAuthorCache]);

  const getAuthor = useCallback(async (authorId: string) => {
    const cached = authorCache.current.get(authorId);
    if (cached) return cached;
    const resolved = await resolveAuthor(authorId);
    authorCache.current.set(authorId, resolved);
    return resolved;
  }, []);

  const appendComment = useCallback((postId: string, comment: ResolvedPostComment) => {
    if (!postIdSet.has(postId)) return;
    setCommentsByPost((prev) => {
      const list = prev[postId] ?? [];
      if (list.some((c) => c.id === comment.id)) return prev;
      return { ...prev, [postId]: [...list, comment] };
    });
    authorCache.current.set(comment.author_id, {
      author_display: comment.author_display,
      author_email: comment.author_email,
    });
  }, [postIdSet]);

  const removeComment = useCallback((commentId: string, postId: string) => {
    if (!postIdSet.has(postId)) return;
    setCommentsByPost((prev) => {
      const list = prev[postId];
      if (!list) return prev;
      return { ...prev, [postId]: list.filter((c) => c.id !== commentId) };
    });
  }, [postIdSet]);

  const applyLikeInsert = useCallback(
    (postId: string, userId: string) => {
      if (!postIdSet.has(postId)) return;
      setLikeCountByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? 0) + 1,
      }));
      if (viewerId && userId === viewerId) {
        setLikedByMe((prev) => new Set(prev).add(postId));
      }
    },
    [postIdSet, viewerId]
  );

  const applyLikeDelete = useCallback(
    (postId: string, userId: string) => {
      if (!postIdSet.has(postId)) return;
      setLikeCountByPost((prev) => ({
        ...prev,
        [postId]: Math.max(0, (prev[postId] ?? 0) - 1),
      }));
      if (viewerId && userId === viewerId) {
        setLikedByMe((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      }
    },
    [postIdSet, viewerId]
  );

  const setLikeState = useCallback((postId: string, liked: boolean, count: number) => {
    setLikeCountByPost((prev) => ({ ...prev, [postId]: count }));
    setLikedByMe((prev) => {
      const next = new Set(prev);
      if (liked) next.add(postId);
      else next.delete(postId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled || postIds.length === 0) return;

    const supabase = createClient();

    const onCommentInsert = async (row: CommentRow) => {
      if (!postIdSet.has(row.post_id)) return;
      if (row.moderation_status && row.moderation_status !== "visible") return;
      const author = await getAuthor(row.author_id);
      appendComment(row.post_id, rowToComment(row, author));
      window.dispatchEvent(new Event("community-activity-refresh"));
    };

    const onCommentDelete = (row: { id: string; post_id: string }) => {
      removeComment(row.id, row.post_id);
    };

    const onLikeInsert = (row: LikeRow) => {
      if (viewerId && row.user_id === viewerId) return;
      applyLikeInsert(row.post_id, row.user_id);
    };

    const onLikeDelete = (row: LikeRow) => {
      if (viewerId && row.user_id === viewerId) return;
      applyLikeDelete(row.post_id, row.user_id);
    };

    const channel = supabase
      .channel(`community-engagement:${postIds.join(",")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_post_comments" },
        (payload) => void onCommentInsert(payload.new as CommentRow)
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "community_post_comments" },
        (payload) => onCommentDelete(payload.old as { id: string; post_id: string })
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_likes" },
        (payload) => onLikeInsert(payload.new as LikeRow)
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "community_likes" },
        (payload) => onLikeDelete(payload.old as LikeRow)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [
    enabled,
    postIds,
    postIdSet,
    getAuthor,
    appendComment,
    removeComment,
    applyLikeInsert,
    applyLikeDelete,
    viewerId,
  ]);

  const getComments = useCallback(
    (postId: string) => commentsByPost[postId] ?? [],
    [commentsByPost]
  );

  const getLikeCount = useCallback((postId: string) => likeCountByPost[postId] ?? 0, [likeCountByPost]);

  const isLiked = useCallback((postId: string) => likedByMe.has(postId), [likedByMe]);

  return {
    getComments,
    getLikeCount,
    isLiked,
    appendComment,
    removeComment,
    setLikeState,
  };
}
