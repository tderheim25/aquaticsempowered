"use client";

import EditIcon from "@mui/icons-material/Edit";
import {
  Avatar,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { buildDisplayName } from "@/lib/profile/avatar";

import { CommunityProfileEditForm } from "./CommunityProfileEditForm";

type ProfileUser = {
  id: string;
  email: string;
  full_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_path?: string | null;
};

export function CommunityProfileSelfCard({
  user,
  avatarUrl,
  bio,
  followerCount,
  followingCount,
  initialEditOpen = false,
}: {
  user: ProfileUser;
  avatarUrl: string | null;
  bio: string;
  followerCount: number;
  followingCount: number;
  initialEditOpen?: boolean;
}) {
  const [editOpen, setEditOpen] = useState(initialEditOpen);

  useEffect(() => {
    setEditOpen(initialEditOpen);
  }, [initialEditOpen]);

  const displayName = buildDisplayName({
    first_name: user.first_name,
    last_name: user.last_name,
    full_name: user.full_name,
    email: user.email,
  });

  const initial = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-start" }}>
        <Avatar
          src={avatarUrl ?? undefined}
          sx={{ width: 72, height: 72, fontSize: "1.5rem", bgcolor: "primary.main" }}
        >
          {initial}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>{followerCount}</strong> followers
                </Typography>
                <Typography variant="body2">
                  <strong>{followingCount}</strong> following
                </Typography>
              </Stack>
            </Box>
            <Tooltip title="Edit profile">
              <IconButton
                aria-label="Edit profile"
                onClick={() => setEditOpen(true)}
                color="primary"
                sx={{
                  border: 1,
                  borderColor: "divider",
                  flexShrink: 0,
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Stack>

      {bio.trim() ? (
        <Typography variant="body2" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
          {bio}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          No bio yet.
        </Typography>
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit profile</DialogTitle>
        <DialogContent>
          <CommunityProfileEditForm
            user={user}
            avatarUrl={avatarUrl}
            bio={bio}
            onClose={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
