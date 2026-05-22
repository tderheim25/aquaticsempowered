import { CommunityFeedPanel } from "@/components/community/CommunityFeedPanel";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsersRowWithAdminFallback, getSessionUser } from "@/lib/auth/rbac";
import { resolveCommunityViewer } from "@/lib/community/communityPartition";
import { canUsePublicCommunity } from "@/lib/community/publicAccess";
import { loadCommunityFeedData } from "@/lib/community/loadCommunityFeedData";
import { loadCommunityJobsData } from "@/lib/community/loadCommunityJobsData";
import { loadCommunityMarketplaceData } from "@/lib/community/loadCommunityMarketplaceData";
import { serializeLoadedCommunityFeed } from "@/lib/community/serializeFeedEngagement";
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
          "Could not save your post. In Supabase SQL Editor, run supabase/scripts/RUN_THIS_community_post_save_fix.sql (or migration 0032), then sign out and sign back in.",
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
    case "job_created":
      return { severity: "success" as const, text: "Job posted to the community." };
    case "job_deleted":
      return { severity: "success" as const, text: "Job posting removed." };
    case "job_invalid":
      return { severity: "error" as const, text: "Add a title and a description (at least 10 characters)." };
    case "job_invalid_url":
      return { severity: "error" as const, text: "Apply link must be a valid http or https URL." };
    case "job_invalid_email":
      return { severity: "error" as const, text: "Contact email doesn’t look valid." };
    case "job_save_failed":
      return {
        severity: "error" as const,
        text: "Could not save the job post. Apply Supabase migration 0018 if you have not, then try again.",
      };
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
  searchParams: Promise<{ status?: string; tab?: string }>;
}) {
  const { status, tab } = await searchParams;
  const activeTab =
    tab === "jobs" ? "jobs" : tab === "marketplace" ? "marketplace" : "feed";
  const flash = statusMessage(status);

  const user = await getSessionUser();
  const sessionSupabase = await createClient();
  const profile = user ? await getUsersRowWithAdminFallback(user.id) : null;
  const canInteract = canUsePublicCommunity(user?.id, profile);

  const viewer = profile ? await resolveCommunityViewer(profile) : null;

  // Prefer service-role reads so the feed loads reliably (RLS + JWT org_id can block session queries).
  const feedClient = createAdminClientIfConfigured() ?? sessionSupabase;

  let feed;
  let jobsFeed;
  let marketplace;
  if (canInteract && viewer) {
    feed = await loadCommunityFeedData(feedClient, {
      viewer,
      globalFeedOnly: false,
      fetchLimit: 120,
      sliceLimit: 40,
      includeComments: true,
    });
    jobsFeed = await loadCommunityJobsData(feedClient, {
      viewer,
      globalFeedOnly: false,
      limit: 40,
    });
    marketplace = await loadCommunityMarketplaceData(feedClient);
  } else {
    feed = await loadCommunityFeedData(feedClient, {
      viewer: null,
      globalFeedOnly: true,
      fetchLimit: 12,
      sliceLimit: 4,
      includeComments: false,
    });
    jobsFeed = await loadCommunityJobsData(feedClient, {
      viewer: null,
      globalFeedOnly: true,
      limit: 4,
    });
    marketplace = await loadCommunityMarketplaceData(feedClient);
  }

  return (
    <CommunityFeedPanel
      variant={canInteract ? "full" : "preview"}
      activeTab={activeTab}
      viewer={viewer}
      canInteract={canInteract}
      feed={serializeLoadedCommunityFeed(feed)}
      jobsFeed={jobsFeed}
      marketplace={marketplace}
      flash={flash}
      subtitle={canInteract ? undefined : ""}
      showProfileWarning={Boolean(user && !profile)}
    />
  );
}
