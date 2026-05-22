import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { getUsersRowForAuthUser } from "@/lib/auth/rbac";
import { buildDisplayName, signAvatarPath } from "@/lib/profile/avatar";
import { communityProfilePath } from "@/lib/profile/paths";
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
        : (user.email ?? "Member"),
      avatarUrl: profile ? await signAvatarPath(supabase, profile.avatar_path) : null,
      profileHref: communityProfilePath(user.id),
    };
  }

  return <MarketingChrome headerUser={headerUser}>{children}</MarketingChrome>;
}
