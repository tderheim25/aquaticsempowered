import { Avatar } from "@mui/material";

import { communityAvatarSx } from "./communityUi";

export type CommunityAvatarProps = {
  src?: string | null;
  initials: string;
  size?: number;
};

/** Brand-styled avatar (gradient, white ring, shadow) — matches marketing header. */
export function CommunityAvatar({ src, initials, size = 40 }: CommunityAvatarProps) {
  const letter = initials.slice(0, 2).toUpperCase() || "?";
  return (
    <Avatar src={src ?? undefined} sx={communityAvatarSx(size)}>
      {letter}
    </Avatar>
  );
}
