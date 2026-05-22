import { Box } from "@mui/material";
import { Suspense } from "react";

import { MarketingPostHog } from "@/components/marketing/MarketingPostHog";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { getUsersRowForAuthUser } from "@/lib/auth/rbac";
import { buildDisplayName, signAvatarPath } from "@/lib/profile/avatar";
import { createClient } from "@/lib/supabase/server";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let headerUser = null;
  if (user) {
    const profile = await getUsersRowForAuthUser(user.id);
    headerUser = {
      displayName: profile
        ? buildDisplayName({
            first_name: profile.first_name,
            last_name: profile.last_name,
            full_name: profile.full_name,
            email: profile.email,
          })
        : user.email ?? "Member",
      avatarUrl: profile ? await signAvatarPath(supabase, profile.avatar_path) : null,
    };
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteHeader user={headerUser} />
      <Suspense fallback={null}>
        <MarketingPostHog />
      </Suspense>
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      <SiteFooter />
    </Box>
  );
}
