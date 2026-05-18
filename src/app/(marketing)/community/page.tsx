import { Alert, Box } from "@mui/material";

import { CommunityFeedPanel } from "@/components/community/CommunityFeedPanel";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsersRowForAuthUser, getSessionUser } from "@/lib/auth/rbac";
import { getAllowedViewsForProfile } from "@/lib/auth/viewPermissions";
import { loadCommunityFeedData } from "@/lib/community/loadCommunityFeedData";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Community | Aquatics Empowered",
};

function statusMessage(status?: string) {
  switch (status) {
    case "created":
      return { severity: "success" as const, text: "Post published." };
    case "deleted":
      return { severity: "success" as const, text: "Post removed." };
    case "invalid":
      return { severity: "error" as const, text: "Add some text or at least one image." };
    case "invalid_file":
      return { severity: "error" as const, text: "Only JPEG, PNG, WebP, or GIF images are allowed." };
    case "file_too_large":
      return { severity: "error" as const, text: "Each image must be 5 MB or smaller." };
    case "too_many_images":
      return { severity: "error" as const, text: "You can attach up to 5 images per post." };
    case "upload_error":
      return { severity: "error" as const, text: "Image upload failed. Try again." };
    case "error":
      return { severity: "error" as const, text: "Something went wrong. Please try again." };
    case "post_save_failed":
      return {
        severity: "error" as const,
        text:
          "Could not save your post. Apply Supabase migrations 0007 and 0008 if you have not, then sign out and sign back in so your JWT matches your account.",
      };
    case "media_save_failed":
      return {
        severity: "error" as const,
        text:
          "Your post was saved but attaching an image failed. Try removing photos and posting again, or use a smaller image.",
      };
    case "comment_invalid":
      return { severity: "error" as const, text: "Add a comment before submitting." };
    case "comment_error":
      return { severity: "error" as const, text: "Could not save that comment. Try again." };
    default:
      return null;
  }
}

function createAdminClientIfConfigured() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return null;
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export default async function MarketingCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const flash = statusMessage(status);

  const user = await getSessionUser();
  const sessionSupabase = await createClient();
  const profile = user ? await getUsersRowForAuthUser(user.id) : null;

  let canInteract = false;
  if (profile) {
    const allowed = await getAllowedViewsForProfile({ role: profile.role, app_role_id: profile.app_role_id });
    canInteract = allowed.includes("community");
  }

  const viewer = profile ? { id: profile.id, org_id: profile.org_id } : null;

  let feed;
  if (canInteract && viewer) {
    feed = await loadCommunityFeedData(sessionSupabase, {
      viewer,
      globalFeedOnly: false,
      fetchLimit: 120,
      sliceLimit: 40,
      includeComments: true,
    });
  } else {
    const liftClient = createAdminClientIfConfigured() ?? sessionSupabase;
    feed = await loadCommunityFeedData(liftClient, {
      viewer: null,
      globalFeedOnly: true,
      fetchLimit: 12,
      sliceLimit: 4,
      includeComments: false,
    });
  }

  return (
    <Box sx={{ pt: 2 }}>
      {user && profile && !canInteract ? (
        <Box sx={{ maxWidth: "xl", mx: "auto", px: { xs: 2, sm: 3 }, mb: 2 }}>
          <Alert severity="info">
            You&apos;re signed in, but your role doesn&apos;t include the full community workspace yet. You can still
            browse public highlights — open your portal for the tools your plan allows.
          </Alert>
        </Box>
      ) : null}

      <CommunityFeedPanel
        variant={canInteract ? "full" : "preview"}
        viewer={viewer}
        canInteract={canInteract}
        feed={feed}
        flash={flash}
        subtitle={canInteract ? undefined : ""}
      />
    </Box>
  );
}
