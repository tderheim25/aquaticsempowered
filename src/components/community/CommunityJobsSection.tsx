import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";

import {
  createCommunityJobAction,
  deleteCommunityJobAction,
} from "@/app/(dashboard)/app/community/actions";
import { formatCommunityTimestamp } from "@/lib/community/formatCommunityTimestamp";
import type { CommunityJobRow, LoadedCommunityJobs } from "@/lib/community/loadCommunityJobsData";
import { communityProfilePath } from "@/lib/profile/paths";

import { CommunityAvatar } from "./CommunityAvatar";
import {
  communityContainedButtonSx,
  communitySectionTitleSx,
  communitySurfacePaperSx,
} from "./communityUi";

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  seasonal: "Seasonal",
  contract: "Contract",
  internship: "Internship",
};

export type CommunityJobsSectionProps = {
  variant: "full" | "preview";
  viewer: { id: string; org_id: string | null } | null;
  canInteract: boolean;
  jobsFeed: LoadedCommunityJobs;
  previewDescriptionMaxChars?: number;
};

function displayName(u: { full_name: string | null; email: string }) {
  return u.full_name?.trim() || u.email.split("@")[0] || "Member";
}

function initials(u: { full_name: string | null; email: string }) {
  return displayName(u).slice(0, 2).toUpperCase();
}

function truncateText(text: string, max: number) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

function profileHrefForAuthor(authorId: string) {
  return communityProfilePath(authorId);
}

function loginForProfileHref(authorId: string) {
  return `/login?next=${encodeURIComponent(profileHrefForAuthor(authorId))}`;
}

function JobApplyActions({
  job,
  canInteract,
}: {
  job: CommunityJobRow;
  canInteract: boolean;
}) {
  const applyUrl = job.apply_url?.trim();
  const email = job.contact_email?.trim();

  if (!canInteract) {
    return (
      <Typography variant="caption" color="text.secondary">
        <Link href="/login?next=%2Fcommunity%3Ftab%3Djobs" style={{ fontWeight: 600, textDecoration: "none" }}>
          Sign in to apply or contact the poster
        </Link>
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {applyUrl ? (
        <Button
          size="small"
          variant="contained"
          component="a"
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Apply online
        </Button>
      ) : null}
      {email ? (
        <Button size="small" variant="outlined" component="a" href={`mailto:${email}`}>
          Email recruiter
        </Button>
      ) : null}
      {!applyUrl && !email ? (
        <Typography variant="caption" color="text.secondary">
          Contact the poster via their profile or network.
        </Typography>
      ) : null}
    </Stack>
  );
}

export function CommunityJobsSection({
  variant,
  viewer,
  canInteract,
  jobsFeed,
  previewDescriptionMaxChars = 220,
}: CommunityJobsSectionProps) {
  const { jobs, jobsError, authorById } = jobsFeed;
  const showComposer = variant === "full" && canInteract && viewer;

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {viewer?.org_id
          ? "Share open roles with your organization — lifeguards, operators, instructors, and seasonal staff."
          : "Share open roles with other operators on the platform — lifeguards, operators, instructors, and seasonal staff."}
      </Typography>

      {jobsError ? <Alert severity="error">Could not load job postings.</Alert> : null}

      {showComposer ? (
        <Paper variant="outlined" sx={communitySurfacePaperSx()}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <WorkOutlineIcon color="primary" />
            <Typography variant="h6" sx={communitySectionTitleSx}>
              Post a job
            </Typography>
          </Stack>
          <Box component="form" action={createCommunityJobAction}>
            <Stack spacing={1.5}>
              <TextField name="title" label="Job title" required fullWidth placeholder="e.g. Head Lifeguard" />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  name="company_name"
                  label="Company / facility"
                  fullWidth
                  placeholder="Your organization or pool name"
                />
                <TextField name="location" label="Location" fullWidth placeholder="City, state or region" />
              </Stack>
              <TextField name="employment_type" label="Employment type" select required fullWidth defaultValue="full_time">
                {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                name="description"
                label="Role description"
                required
                multiline
                minRows={4}
                fullWidth
                placeholder="Responsibilities, schedule, certifications, pay range if you want to include it…"
                helperText="At least 10 characters."
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  name="apply_url"
                  label="Apply link (optional)"
                  fullWidth
                  placeholder="https://…"
                  type="url"
                />
                <TextField
                  name="contact_email"
                  label="Contact email (optional)"
                  fullWidth
                  placeholder="hiring@example.com"
                  type="email"
                />
              </Stack>
              <Button
                type="submit"
                variant="contained"
                sx={{ alignSelf: "flex-start", ...communityContainedButtonSx() }}
              >
                Publish job
              </Button>
            </Stack>
          </Box>
        </Paper>
      ) : null}

      <Typography variant="h6" sx={communitySectionTitleSx}>
        {variant === "preview" ? "Recent openings" : "Open roles"}
      </Typography>

      {jobs.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {variant === "preview"
            ? "No public job posts yet. Sign in to browse roles from your organization or the wider network."
            : "No job posts yet. Be the first to share an opening with your team."}
        </Typography>
      ) : null}

      <Stack spacing={2}>
        {jobs.map((job) => {
          const author = authorById.get(job.author_id);
          const name = author ? displayName(author) : "Member";
          const sub = author?.email ?? "";
          const profileLink = canInteract ? profileHrefForAuthor(job.author_id) : loginForProfileHref(job.author_id);
          const typeLabel = EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type;
          const descriptionText =
            variant === "preview"
              ? truncateText(job.description, previewDescriptionMaxChars)
              : job.description;

          return (
            <Card key={job.id} variant="outlined" sx={{ borderLeft: 4, borderColor: "primary.main" }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Link href={profileLink} style={{ textDecoration: "none" }}>
                    <CommunityAvatar initials={author ? initials(author) : "?"} size={40} />
                  </Link>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                          <Chip size="small" icon={<WorkOutlineIcon />} label="Job" color="primary" variant="outlined" />
                          <Chip size="small" label={typeLabel} variant="outlined" />
                        </Stack>
                        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
                          {job.title}
                        </Typography>
                        {(job.company_name || job.location) && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {[job.company_name, job.location].filter(Boolean).join(" · ")}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                          Posted by{" "}
                          <Typography
                            component={Link}
                            href={profileLink}
                            variant="caption"
                            sx={{ fontWeight: 700, color: "text.primary", textDecoration: "none" }}
                          >
                            {name}
                          </Typography>{" "}
                          · {formatCommunityTimestamp(job.created_at)} · {sub}
                        </Typography>
                      </Box>
                      {variant === "full" && canInteract && viewer && job.author_id === viewer.id ? (
                        <Box component="form" action={deleteCommunityJobAction}>
                          <input type="hidden" name="jobId" value={job.id} />
                          <Button type="submit" size="small" color="error">
                            Remove
                          </Button>
                        </Box>
                      ) : null}
                    </Stack>

                    {descriptionText ? (
                      <Typography variant="body2" sx={{ mt: 1.5, whiteSpace: "pre-wrap" }}>
                        {descriptionText}
                      </Typography>
                    ) : null}

                    {variant === "preview" && job.description.length > previewDescriptionMaxChars ? (
                      <Typography variant="caption" color="primary" sx={{ display: "block", mt: 1, fontWeight: 600 }}>
                        <Link
                          href="/login?next=%2Fcommunity%3Ftab%3Djobs"
                          style={{ color: "inherit", textDecoration: "underline" }}
                        >
                          Sign in to read the full description
                        </Link>
                      </Typography>
                    ) : null}

                    <Divider sx={{ my: 1.5 }} />

                    <JobApplyActions job={job} canInteract={canInteract} />

                    <Button size="small" component={Link} href={profileLink} sx={{ mt: 1 }}>
                      {canInteract ? "View poster profile" : "Sign in to view profile"}
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
}
