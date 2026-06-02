"use client";

import {
  Box,
  Button,
  DialogActions,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  removeUserAvatarAction,
  updateUserProfileAction,
} from "@/app/(dashboard)/app/profile/actions";
import { updateCommunityBioAction } from "@/app/(dashboard)/app/community/actions";
import { AvatarUploadButton } from "@/components/profile/AvatarUploadButton";
import { buildDisplayName } from "@/lib/profile/avatar";
import { communityProfilePath } from "@/lib/profile/paths";

import { CommunityAvatar } from "./CommunityAvatar";
import { communityContainedButtonSx, communityOutlinedButtonSx, communitySectionTitleSx } from "./communityUi";

type ProfileUser = {
  id: string;
  email: string;
  full_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_path?: string | null;
};

export function CommunityProfileEditForm({
  user,
  avatarUrl,
  bio,
  onClose,
}: {
  user: ProfileUser;
  avatarUrl: string | null;
  bio: string;
  onClose: () => void;
}) {
  const displayName = buildDisplayName({
    first_name: user.first_name,
    last_name: user.last_name,
    full_name: user.full_name,
    email: user.email,
  });

  const redirectTo = communityProfilePath(user.id);

  return (
    <Stack spacing={2.5} sx={{ pt: 0.5 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <CommunityAvatar
          src={avatarUrl}
          initials={displayName.slice(0, 2).toUpperCase()}
          size={56}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          <AvatarUploadButton redirectTo={redirectTo} />
          {user.avatar_path ? (
            <Box component="form" action={removeUserAvatarAction}>
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <Button type="submit" size="small" color="inherit">
                Remove photo
              </Button>
            </Box>
          ) : null}
        </Stack>
      </Stack>

      <Box component="form" action={updateUserProfileAction}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <Stack spacing={1.5}>
          <Typography variant="subtitle2" sx={communitySectionTitleSx}>
            Your name
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              id="community-profile-first-name"
              name="firstName"
              label="First name"
              fullWidth
              defaultValue={user.first_name ?? ""}
              inputProps={{ maxLength: 80 }}
            />
            <TextField
              id="community-profile-last-name"
              name="lastName"
              label="Last name"
              fullWidth
              defaultValue={user.last_name ?? ""}
              inputProps={{ maxLength: 80 }}
            />
          </Stack>
          <TextField
            id="community-profile-email"
            label="Email"
            fullWidth
            value={user.email}
            disabled
            helperText="Email is managed through your sign-in provider."
          />
          <Button
            type="submit"
            variant="contained"
            size="small"
            sx={{ alignSelf: "flex-start", ...communityContainedButtonSx() }}
          >
            Save name
          </Button>
        </Stack>
      </Box>

      <Box component="form" action={updateCommunityBioAction}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" sx={communitySectionTitleSx}>
            Bio
          </Typography>
          <TextField
            id="community-profile-bio"
            name="bio"
            label="Tell others about yourself"
            multiline
            minRows={3}
            fullWidth
            defaultValue={bio}
            inputProps={{ maxLength: 2000 }}
          />
          <Button
            type="submit"
            variant="outlined"
            size="small"
            sx={{ alignSelf: "flex-start", ...communityOutlinedButtonSx() }}
          >
            Save bio
          </Button>
        </Stack>
      </Box>

      <DialogActions sx={{ px: 0, pb: 0 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Stack>
  );
}
