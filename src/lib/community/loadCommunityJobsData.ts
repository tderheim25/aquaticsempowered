import type { SupabaseClient } from "@supabase/supabase-js";

import type { CommunityFeedViewer } from "./loadCommunityFeedData";

export type CommunityJobRow = {
  id: string;
  author_id: string;
  title: string;
  company_name: string;
  location: string;
  employment_type: string;
  description: string;
  apply_url: string | null;
  contact_email: string | null;
  created_at: string;
};

export type LoadedCommunityJobs = {
  jobs: CommunityJobRow[];
  jobsError: boolean;
  authorById: Map<string, { id: string; full_name: string | null; email: string }>;
};

export async function loadCommunityJobsData(
  supabase: SupabaseClient,
  options: {
    viewer: CommunityFeedViewer | null;
    globalFeedOnly: boolean;
    limit: number;
  }
): Promise<LoadedCommunityJobs> {
  const { viewer, globalFeedOnly, limit } = options;

  let jobsQuery = supabase
    .from("community_job_posts")
    .select(
      "id, author_id, title, company_name, location, employment_type, description, apply_url, contact_email, created_at"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (globalFeedOnly) {
    jobsQuery = jobsQuery.is("org_id", null);
  } else if (viewer?.org_id) {
    jobsQuery = jobsQuery.or(`org_id.eq.${viewer.org_id},org_id.is.null`);
  } else {
    jobsQuery = jobsQuery.is("org_id", null);
  }

  const { data: jobs, error: jobsError } = await jobsQuery;
  const jobList = jobs ?? [];
  const authorIds = [...new Set(jobList.map((j) => j.author_id))];

  const { data: authorRows } =
    authorIds.length > 0
      ? await supabase.from("users").select("id, full_name, email").in("id", authorIds)
      : { data: [] as { id: string; full_name: string | null; email: string }[] };

  const authorById = new Map((authorRows ?? []).map((a) => [a.id, a]));

  return {
    jobs: jobList as CommunityJobRow[],
    jobsError: Boolean(jobsError),
    authorById,
  };
}
