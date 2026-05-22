"use client";

import { Button } from "@mui/material";
import { useState, useTransition } from "react";

type Props = {
  postId: string;
  liked: boolean;
  count: number;
  onToggled: (liked: boolean, count: number) => void;
};

export function CommunityPostLikeButton({ postId, liked, count, onToggled }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  const toggle = () => {
    setError(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/community/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });
        if (!res.ok) {
          setError(true);
          return;
        }
        const data = (await res.json()) as { liked: boolean; count: number };
        onToggled(data.liked, data.count);
      } catch {
        setError(true);
      }
    });
  };

  return (
    <Button
      type="button"
      size="small"
      variant={liked ? "contained" : "outlined"}
      disabled={pending}
      onClick={toggle}
      color={error ? "inherit" : undefined}
    >
      {liked ? "Liked" : "Like"} · {count}
    </Button>
  );
}
