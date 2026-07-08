"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Alert from "@mui/material/Alert";

import {
  changePasswordAction,
  removeUserAvatarAction,
  updateUserProfileAction,
} from "@/app/(dashboard)/app/profile/actions";
import { AvatarUploadButton } from "@/components/profile/AvatarUploadButton";
import { CommunityAvatar } from "@/components/community/CommunityAvatar";

type AccountUser = {
  id: string;
  email: string;
  full_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_path?: string | null;
};

export function AccountSettingsPanel({
  user,
  displayName,
  avatarUrl,
  communityProfileHref,
  mustChangePassword = false,
}: {
  user: AccountUser;
  displayName: string;
  avatarUrl: string | null;
  communityProfileHref: string | null;
  mustChangePassword?: boolean;
}) {
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Stack spacing={2.5}>
      {mustChangePassword ? (
        <Alert severity="warning">
          You signed in with a temporary pilot password. Please set a new password below before
          continuing.
        </Alert>
      ) : null}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Profile photo
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <CommunityAvatar src={avatarUrl} initials={initials} size={72} />
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <AvatarUploadButton />
              {user.avatar_path ? (
                <Box component="form" action={removeUserAvatarAction}>
                  <Button type="submit" size="small" color="inherit">
                    Remove photo
                  </Button>
                </Box>
              ) : null}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Box component="form" action={updateUserProfileAction}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Your name
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  name="firstName"
                  label="First name"
                  fullWidth
                  defaultValue={user.first_name ?? ""}
                  inputProps={{ maxLength: 80 }}
                />
                <TextField
                  name="lastName"
                  label="Last name"
                  fullWidth
                  defaultValue={user.last_name ?? ""}
                  inputProps={{ maxLength: 80 }}
                />
              </Stack>
              <TextField
                label="Email"
                fullWidth
                value={user.email}
                disabled
                helperText="To change your email address, contact your organization admin or support."
              />
              <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start" }}>
                Save name
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Box component="form" action={changePasswordAction}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Password
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a strong password you do not use elsewhere.
              </Typography>
              <TextField
                name="newPassword"
                label="New password"
                type="password"
                fullWidth
                autoComplete="new-password"
                inputProps={{ minLength: 8 }}
              />
              <TextField
                name="confirmPassword"
                label="Confirm new password"
                type="password"
                fullWidth
                autoComplete="new-password"
              />
              <Button type="submit" variant="contained" sx={{ alignSelf: "flex-start" }}>
                Update password
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {communityProfileHref ? (
        <Card variant="outlined" sx={{ bgcolor: "action.hover" }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Community profile
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Edit your public bio, posts, and connections on the community feed.
            </Typography>
            <Button component={Link} href={communityProfileHref} variant="outlined" size="small">
              Open community profile
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </Stack>
  );
}
