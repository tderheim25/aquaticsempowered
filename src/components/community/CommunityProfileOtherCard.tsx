import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  acceptNetworkRequestAction,
  cancelNetworkRequestAction,
  declineNetworkRequestAction,
  followUserAction,
  sendNetworkRequestAction,
  unfollowUserAction,
} from "@/app/(dashboard)/app/community/actions";
import { buildDisplayName } from "@/lib/profile/avatar";

import { CommunityAvatar } from "./CommunityAvatar";
import {
  communityContainedButtonSx,
  communityOutlinedButtonSx,
  communityPageTitleSx,
  communitySurfacePaperSx,
} from "./communityUi";

type ProfileUser = {
  id: string;
  email: string;
  full_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

export type CommunityProfileOtherCardProps = {
  user: ProfileUser;
  avatarUrl: string | null;
  bio: string;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  inNetwork: boolean;
  pendingInRequestId: string | null;
  pendingOutRequestId: string | null;
  profileRedirectPath: string;
};

function displayName(u: ProfileUser) {
  return buildDisplayName({
    first_name: u.first_name,
    last_name: u.last_name,
    full_name: u.full_name,
    email: u.email,
  });
}

function initials(u: ProfileUser) {
  return displayName(u).slice(0, 2).toUpperCase();
}

export function CommunityProfileOtherCard({
  user,
  avatarUrl,
  bio,
  followerCount,
  followingCount,
  isFollowing,
  inNetwork,
  pendingInRequestId,
  pendingOutRequestId,
  profileRedirectPath,
}: CommunityProfileOtherCardProps) {
  const name = displayName(user);

  return (
    <Paper variant="outlined" sx={communitySurfacePaperSx()}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "flex-start" }}>
        <CommunityAvatar src={avatarUrl} initials={initials(user)} size={72} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" sx={{ ...communityPageTitleSx, fontSize: "1.5rem" }}>
            {name}
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

          <Stack spacing={1.5} sx={{ mt: 2 }} alignItems="flex-start">
            {isFollowing ? (
              <Box component="form" action={unfollowUserAction}>
                <input type="hidden" name="followeeId" value={user.id} />
                <Button type="submit" variant="outlined" sx={communityOutlinedButtonSx()}>
                  Following
                </Button>
              </Box>
            ) : (
              <Box component="form" action={followUserAction}>
                <Stack spacing={1} alignItems="flex-start">
                  <input type="hidden" name="followeeId" value={user.id} />
                  <Button type="submit" variant="contained" sx={communityContainedButtonSx()}>
                    Follow
                  </Button>
                  <FormControlLabel
                    control={<Checkbox name="alsoNetwork" value="1" size="small" />}
                    label="Also send a network connection request"
                  />
                </Stack>
              </Box>
            )}

            {inNetwork ? (
              <Chip label="In your network" color="success" size="small" variant="outlined" />
            ) : null}

            {!inNetwork && pendingInRequestId ? (
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {name} invited you to connect.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Box component="form" action={acceptNetworkRequestAction}>
                    <input type="hidden" name="requestId" value={pendingInRequestId} />
                    <input type="hidden" name="redirectTo" value={profileRedirectPath} />
                    <Button type="submit" size="small" variant="contained" sx={communityContainedButtonSx()}>
                      Accept
                    </Button>
                  </Box>
                  <Box component="form" action={declineNetworkRequestAction}>
                    <input type="hidden" name="requestId" value={pendingInRequestId} />
                    <input type="hidden" name="redirectTo" value={profileRedirectPath} />
                    <Button type="submit" size="small" variant="outlined" sx={communityOutlinedButtonSx()}>
                      Decline
                    </Button>
                  </Box>
                </Stack>
              </Stack>
            ) : null}

            {!inNetwork && !pendingInRequestId && pendingOutRequestId ? (
              <Box component="form" action={cancelNetworkRequestAction}>
                <input type="hidden" name="requestId" value={pendingOutRequestId} />
                <input type="hidden" name="redirectTo" value={profileRedirectPath} />
                <Button type="submit" variant="outlined" size="small" sx={communityOutlinedButtonSx()}>
                  Cancel request
                </Button>
              </Box>
            ) : null}

            {!inNetwork && !pendingInRequestId && !pendingOutRequestId && isFollowing ? (
              <Box component="form" action={sendNetworkRequestAction}>
                <input type="hidden" name="addresseeId" value={user.id} />
                <input type="hidden" name="redirectTo" value={profileRedirectPath} />
                <Button type="submit" variant="outlined" size="small" sx={communityOutlinedButtonSx()}>
                  Request network connection
                </Button>
              </Box>
            ) : null}
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
    </Paper>
  );
}
