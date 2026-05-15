import {
  Avatar,
  Box,
  Button,
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

type ProfileUser = {
  id: string;
  email: string;
  full_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_path?: string | null;
};

export function CommunityProfileSelfSettings({
  user,
  avatarUrl,
  bio,
  followerCount,
  followingCount,
}: {
  user: ProfileUser;
  avatarUrl: string | null;
  bio: string;
  followerCount: number;
  followingCount: number;
}) {
  const displayName = buildDisplayName({
    first_name: user.first_name,
    last_name: user.last_name,
    full_name: user.full_name,
    email: user.email,
  });

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-start" }}>
        <Avatar
          src={avatarUrl ?? undefined}
          sx={{ width: 72, height: 72, bgcolor: "primary.main", fontSize: "1.5rem" }}
        >
          {displayName.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={2} sx={{ mt: { xs: 0, sm: 1 } }}>
            <Typography variant="body2">
              <strong>{followerCount}</strong> followers
            </Typography>
            <Typography variant="body2">
              <strong>{followingCount}</strong> following
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" alignItems="center">
            <AvatarUploadButton />
            {user.avatar_path ? (
              <Box component="form" action={removeUserAvatarAction}>
                <Button type="submit" size="small" color="inherit">
                  Remove photo
                </Button>
              </Box>
            ) : null}
          </Stack>
        </Box>
      </Stack>

      <Box component="form" action={updateUserProfileAction}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
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
          <Button type="submit" variant="contained" size="small" sx={{ alignSelf: "flex-start" }}>
            Save name
          </Button>
        </Stack>
      </Box>

      <Box component="form" action={updateCommunityBioAction}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Bio
          </Typography>
          <TextField
            id="community-profile-bio"
            name="bio"
            label="Tell others about yourself"
            multiline
            minRows={2}
            fullWidth
            defaultValue={bio}
            inputProps={{ maxLength: 2000 }}
          />
          <Button type="submit" variant="outlined" size="small" sx={{ alignSelf: "flex-start" }}>
            Save bio
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
