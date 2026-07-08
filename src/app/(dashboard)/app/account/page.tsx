import { Box, Typography } from "@mui/material";

import { AccountSettingsPanel } from "@/components/account/AccountSettingsPanel";
import { StatusToast, type StatusToastMessages } from "@/components/ui/StatusToast";
import { requireProfileForApp } from "@/lib/auth/rbac";
import { getAllowedViewsForProfile } from "@/lib/auth/viewPermissions";
import { communityProfilePath } from "@/lib/profile/paths";
import { buildDisplayName, signAvatarPath } from "@/lib/profile/avatar";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Account settings | Aquatics Empowered",
};

const ACCOUNT_TOAST_MESSAGES: StatusToastMessages = {
  saved: { severity: "success", text: "Name saved." },
  avatar_saved: { severity: "success", text: "Profile photo updated." },
  avatar_removed: { severity: "success", text: "Profile photo removed." },
  password_saved: { severity: "success", text: "Password updated." },
  invalid_file: { severity: "error", text: "Choose a JPEG, PNG, WebP, or GIF image (max 2 MB)." },
  file_too_large: { severity: "error", text: "Image must be 2 MB or smaller." },
  upload_error: {
    severity: "error",
    text: "Could not upload photo. Apply migration 0014_user_profile_fields.sql in Supabase if you have not yet.",
  },
  password_too_short: { severity: "error", text: "Password must be at least 8 characters." },
  password_mismatch: { severity: "error", text: "New passwords do not match." },
  password_error: {
    severity: "error",
    text: "Could not update password. Sign out and use “Forgot password” if you need to reset it.",
  },
  error: { severity: "error", text: "Could not save changes." },
};

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const profile = await requireProfileForApp();
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const mustChangePassword = authUser?.user_metadata?.must_change_password === true;
  const avatarUrl = await signAvatarPath(supabase, profile.avatar_path);
  const displayName = buildDisplayName({
    first_name: profile.first_name,
    last_name: profile.last_name,
    full_name: profile.full_name,
    email: profile.email,
  });

  const allowedViews = await getAllowedViewsForProfile({
    role: profile.role,
    app_role_id: profile.app_role_id,
  });
  const communityProfileHref = allowedViews.includes("community")
    ? communityProfilePath(profile.id)
    : null;

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 0.5 }}>
        Account settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Update your sign-in details and how your name appears across the platform.
      </Typography>

      <StatusToast status={status} messages={ACCOUNT_TOAST_MESSAGES} />

      <AccountSettingsPanel
        user={profile}
        displayName={displayName}
        avatarUrl={avatarUrl}
        communityProfileHref={communityProfileHref}
        mustChangePassword={mustChangePassword}
      />
    </Box>
  );
}
