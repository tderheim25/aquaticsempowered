import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  addTrainingVideoAction,
  moderateCommunityCommentAction,
  moderateCommunityPostAction,
  moderateJobPostAction,
  updateOrgPlanAction,
  upsertAdPlacementAction,
  upsertTrainingCourseAction,
} from "@/app/private/ae-console/platform/actions";
import { createAppRoleAction } from "@/app/private/ae-console/permissions/actions";
import { updateDemoRequestEmailAction } from "@/app/private/ae-console/settings/actions";
import { RoleManagementPanel } from "@/components/admin/RoleManagementPanel";
import { AE_CONSOLE_SECTION_META } from "@/components/super-admin/aeConsoleNavConfig";
import {
  DataTable,
  StatusPill,
  TableBody,
  TableCell,
  TableHead,
  TablePrimaryCell,
  TableRow,
} from "@/components/ui/data-table";
import {
  AeConsoleContentFrame,
  AeConsolePanel,
  AeConsoleSectionHeader,
  AeConsoleStatCard,
} from "@/components/super-admin/AeConsolePrimitives";
import { StatusToast } from "@/components/ui/StatusToast";
import { OrganizationsConsoleSection } from "@/components/super-admin/OrganizationsConsoleSection";
import { SupportProvidersConsoleSection } from "@/components/super-admin/SupportProvidersConsoleSection";
import { SupportTicketsConsoleSection } from "@/components/super-admin/SupportTicketsConsoleSection";
import { UsersConsoleSection } from "@/components/super-admin/UsersConsoleSection";
import { VendorSection, type VendorApplicationRow } from "@/components/super-admin/VendorSection";
import type { VendorConsoleTab } from "@/components/super-admin/VendorConsoleTabs";
import { getSuperAdminPortalPath } from "@/lib/auth/superAdminPortalConstants";
import { isMissingAppRoleIdColumnError } from "@/lib/auth/rbac";
import { ALL_ROLES, ALL_VIEW_KEYS, VIEW_DEFINITIONS, type AppViewKey } from "@/lib/auth/viewPermissions";
import { requireSuperAdminConsole } from "@/lib/auth/superAdminPortal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanCode, UserRole } from "@/types/database";

const AE_CONSOLE_TOAST_MESSAGES = {
  approved: { text: "Application approved and vendor listing created.", severity: "success" as const },
  rejected: { text: "Application rejected.", severity: "info" as const },
  saved: { text: "Vendor directory updated.", severity: "success" as const },
  logo_updated: { text: "Vendor logo updated.", severity: "success" as const },
  product_saved: { text: "Product saved.", severity: "success" as const },
  product_deleted: { text: "Product removed.", severity: "info" as const },
  error: { text: "Something went wrong. Please try again.", severity: "error" as const },
  invalid: { text: "Some fields are missing or invalid.", severity: "error" as const },
  ad_saved: { text: "Ad placement saved.", severity: "success" as const },
  course_saved: { text: "Course saved.", severity: "success" as const },
  role_created: { text: "Role created.", severity: "success" as const },
  role_updated: { text: "Role updated.", severity: "success" as const },
  ticket_updated: { text: "Support ticket updated.", severity: "success" as const },
  user_updated: { text: "User updated.", severity: "success" as const },
  "tech-invited": { text: "Technician invitation sent.", severity: "success" as const },
  "tech-invited-existing": {
    text: "Invitation sent — they can accept after signing in.",
    severity: "success" as const,
  },
  "tech-invite-resent": { text: "Invitation resent.", severity: "success" as const },
  "invite-email-failed": { text: "Could not send invitation email. Try again.", severity: "error" as const },
  "invite-email-not-configured": {
    text: "Invitation saved but email is not configured (RESEND_API_KEY).",
    severity: "warning" as const,
  },
  "already-member": { text: "That technician is already linked to this provider.", severity: "info" as const },
  "invite-failed": { text: "Could not send invitation. Please try again.", severity: "error" as const },
  org_created: { text: "Organization created.", severity: "success" as const },
  org_updated: { text: "Organization updated.", severity: "success" as const },
  plan_updated: { text: "Plan updated.", severity: "success" as const },
  settings_saved: { text: "Settings saved.", severity: "success" as const },
};

type Section =
  | "overview"
  | "users"
  | "organizations"
  | "permissions"
  | "billing"
  | "support"
  | "support_providers"
  | "vendors"
  | "training"
  | "jobs"
  | "community"
  | "ads"
  | "settings";

const ALL_SECTIONS: Section[] = [
  "overview",
  "users",
  "organizations",
  "permissions",
  "billing",
  "support",
  "support_providers",
  "vendors",
  "training",
  "jobs",
  "community",
  "ads",
  "settings",
];

function parseViews(input: string[]) {
  return input.filter((key) => ALL_VIEW_KEYS.includes(key as AppViewKey));
}

export async function AeConsolePageContent({
  searchParams,
}: {
  searchParams: { section?: string; status?: string; roleId?: string; tab?: string };
}) {
  await requireSuperAdminConsole();
  const rawSection = searchParams.section ?? "overview";
  const section: Section = ALL_SECTIONS.includes(rawSection as Section) ? (rawSection as Section) : "overview";
  const status = searchParams.status;
  const vendorTab: VendorConsoleTab =
    searchParams.tab === "directory"
      ? "directory"
      : searchParams.tab === "products"
        ? "products"
        : "requests";

  const admin = createAdminClient();

  const [
    usersQuery,
    appRolesRes,
    orgsAllRes,
    plansRes,
    ticketsRes,
    supportProvidersRes,
    vendorAppsRes,
    vendorsRes,
    vendorProductsRes,
    coursesRes,
    jobsRes,
    postsRes,
    commentsRes,
    adsRes,
    subsRes,
    settingsRes,
    techInvitesRes,
  ] = await Promise.all([
    admin
      .from("users")
      .select("id, email, full_name, org_id, role, app_role_id, support_provider_id, created_at")
      .order("created_at", { ascending: false }),
    admin.from("app_roles").select("id, slug, label, permissions_base, is_builtin, sort_order").order("sort_order"),
    admin
      .from("organizations")
      .select("id, name, tier, plan_code, founder, created_at, website_url, phone, address")
      .order("name"),
    admin.from("plans").select("code, name").order("sort_order"),
    admin.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(200),
    admin.from("support_providers").select("id, name, phone, contact_name, address_line1, address_line2, city, state_code, postal_code, country, is_active, created_at").order("name"),
    admin.from("vendor_applications").select("*").order("created_at", { ascending: false }).limit(50),
    admin
      .from("vendors")
      .select(
        "id, name, slug, category, website_url, tagline, logo_url, description, contact, region, listing_visible, is_partner",
      )
      .order("name"),
    admin
      .from("vendor_products")
      .select("id, vendor_id, name, description, image_url, product_url, is_visible, created_at")
      .order("created_at", { ascending: false }),
    admin.from("training_courses").select("id, title, slug, category, is_published, sort_order").order("sort_order"),
    admin.from("community_job_posts").select("id, title, company_name, status, is_promoted, author_id, created_at").order("created_at", { ascending: false }).limit(50),
    admin.from("community_posts").select("id, body, author_id, moderation_status, created_at").order("created_at", { ascending: false }).limit(50),
    admin.from("community_post_comments").select("id, body, post_id, author_id, moderation_status, created_at").order("created_at", { ascending: false }).limit(50),
    admin.from("ad_placements").select("*").order("slot_key"),
    admin.from("subscriptions").select("id, org_id, plan_code, status, stripe_customer_id").order("created_at", { ascending: false }).limit(50),
    admin.from("platform_settings").select("key, value, description, updated_at"),
    admin
      .from("support_technician_invitations")
      .select("id, email, full_name, support_provider_id, status, created_at, expires_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  let users = usersQuery.data;
  if (usersQuery.error && isMissingAppRoleIdColumnError(usersQuery.error.message)) {
    const fallback = await admin.from("users").select("id, email, full_name, org_id, role, created_at").order("created_at", { ascending: false });
    users = (fallback.data ?? []).map((u) => ({
      ...u,
      app_role_id: null as string | null,
      support_provider_id: null as string | null,
    }));
  }

  const appRoles = appRolesRes.data ?? [];
  const organizationRows = orgsAllRes.data ?? [];
  const planOptions = (plansRes.data ?? []) as { code: PlanCode; name: string }[];
  const orgNameById = new Map(organizationRows.map((o) => [o.id, o.name]));
  const roleList = appRoles as { id: string; slug: string; label: string; permissions_base: UserRole; is_builtin: boolean }[];
  const roleIds = roleList.map((r) => r.id);
  const { data: permRows } =
    roleIds.length > 0
      ? await admin.from("app_role_view_permissions").select("role_id, view_key, can_view").in("role_id", roleIds)
      : { data: [] as { role_id: string; view_key: string; can_view: boolean }[] };

  const selectedByRoleIdRecord: Record<string, AppViewKey[]> = {};
  for (const role of roleList) {
    const set = new Set<AppViewKey>();
    for (const row of permRows ?? []) {
      if (row.role_id === role.id && row.can_view) {
        const parsed = parseViews([row.view_key]);
        if (parsed[0]) set.add(parsed[0] as AppViewKey);
      }
    }
    selectedByRoleIdRecord[role.id] = Array.from(set);
  }

  const vendorApps = vendorAppsRes.error ? [] : (vendorAppsRes.data ?? []);
  const tickets = ticketsRes.error ? [] : (ticketsRes.data ?? []);
  const supportProviders = supportProvidersRes.error ? [] : (supportProvidersRes.data ?? []);
  const supportTechnicians = (users ?? []).filter((u) => u.role === "support_technician");
  const pendingTechInvites = techInvitesRes.error ? [] : (techInvitesRes.data ?? []);
  const jobs = jobsRes.error ? [] : (jobsRes.data ?? []);
  const posts = postsRes.error ? [] : (postsRes.data ?? []);
  const comments = commentsRes.error ? [] : (commentsRes.data ?? []);
  const courses = coursesRes.error ? [] : (coursesRes.data ?? []);
  const ads = adsRes.error ? [] : (adsRes.data ?? []);
  const subs = subsRes.error ? [] : (subsRes.data ?? []);
  const vendorsList = vendorsRes.error ? [] : (vendorsRes.data ?? []);
  const vendorProducts = vendorProductsRes.error ? [] : (vendorProductsRes.data ?? []);
  const settingsRows = settingsRes.error ? [] : (settingsRes.data ?? []);
  const demoRequestEmail = (() => {
    const row = settingsRows.find((r) => r.key === "demo_request_email");
    const value = (row?.value ?? {}) as { email?: string };
    return value.email ?? "";
  })();

  const pendingVendors = vendorApps.filter((a) => a.status === "pending").length;
  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "pending").length;
  const hiddenPosts = posts.filter((p) => p.moderation_status !== "visible").length;

  const memberCountByOrg = new Map<string, number>();
  for (const u of users ?? []) {
    if (u.org_id) memberCountByOrg.set(u.org_id, (memberCountByOrg.get(u.org_id) ?? 0) + 1);
  }

  const sectionMeta = AE_CONSOLE_SECTION_META[section];
  const consoleBase = getSuperAdminPortalPath();

  return (
    <Stack spacing={3} sx={{ width: "100%", maxWidth: "100%" }}>
      <StatusToast status={status} messages={AE_CONSOLE_TOAST_MESSAGES} />
      <AeConsoleSectionHeader title={sectionMeta.label} description={sectionMeta.description} />

      <AeConsoleContentFrame sectionKey={section}>
        <Stack spacing={2.5}>

          {section === "overview" ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                  xl: "repeat(5, 1fr)",
                },
                gap: 2.5,
              }}
            >
              <AeConsoleStatCard
                label="Users"
                value={users?.length ?? 0}
                hint="All platform accounts"
                accent="primary"
                progress={Math.min(100, ((users?.length ?? 0) / 250) * 100)}
                trend="up"
              />
              <AeConsoleStatCard
                label="Organizations"
                value={organizationRows.length}
                hint="Registered facilities"
                accent="secondary"
                progress={Math.min(100, (organizationRows.length / 100) * 100)}
                trend="up"
              />
              <AeConsoleStatCard
                label="Vendor requests"
                value={pendingVendors}
                hint={pendingVendors ? "Pending review" : "Queue clear"}
                accent={pendingVendors ? "warning" : "default"}
                href={pendingVendors ? `${consoleBase}?section=vendors&tab=requests` : undefined}
                progress={pendingVendors ? Math.min(100, pendingVendors * 12) : 100}
                trend={pendingVendors ? "down" : "up"}
              />
              <AeConsoleStatCard
                label="Open tickets"
                value={openTickets}
                hint="Support needing attention"
                accent={openTickets ? "warning" : "default"}
                href={openTickets ? `${consoleBase}?section=support` : undefined}
                progress={openTickets ? Math.min(100, openTickets * 8) : 100}
                trend={openTickets ? "down" : "up"}
              />
              <AeConsoleStatCard
                label="Moderated posts"
                value={hiddenPosts}
                hint="Hidden or blocked content"
                href={hiddenPosts ? `${consoleBase}?section=community` : undefined}
                progress={hiddenPosts ? Math.min(100, hiddenPosts * 10) : 100}
                trend={hiddenPosts ? "down" : "up"}
              />
            </Box>
          ) : null}

      {section === "users" ? (
        <UsersConsoleSection
          users={(users ?? []).map((u) => ({
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            org_id: u.org_id,
            role: u.role,
            app_role_id: u.app_role_id,
            support_provider_id: (u as { support_provider_id?: string | null }).support_provider_id ?? null,
            created_at: u.created_at,
          }))}
          orgs={organizationRows.map((o) => ({ id: o.id, name: o.name }))}
          appRoles={appRoles.map((r) => ({ id: r.id, slug: r.slug, label: r.label }))}
          supportProviders={supportProviders.map((p) => ({ id: p.id, name: p.name }))}
        />
      ) : null}

      {section === "organizations" ? (
        <OrganizationsConsoleSection
          organizations={organizationRows.map((org) => ({
            id: org.id,
            name: org.name,
            tier: org.tier,
            plan_code: org.plan_code,
            founder: org.founder,
            website_url: org.website_url ?? null,
            phone: org.phone ?? null,
            address: org.address,
            created_at: org.created_at,
            memberCount: memberCountByOrg.get(org.id) ?? 0,
          }))}
          planOptions={planOptions}
          users={(users ?? []).map((u) => ({
            id: u.id,
            email: u.email,
            org_id: u.org_id,
          }))}
        />
      ) : null}

      {section === "permissions" ? (
        <Stack spacing={2}>
          <AeConsolePanel>
            <Stack component="form" action={createAppRoleAction} direction="row" spacing={2} alignItems="flex-end">
              <TextField name="label" label="Role name" required size="small" sx={{ flex: 1 }} />
              <TextField name="permissionsBase" select size="small" label="Base" defaultValue="staff" sx={{ minWidth: 160 }}>
                {ALL_ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
              <Button type="submit" variant="contained">
                Add role
              </Button>
            </Stack>
          </AeConsolePanel>
          <RoleManagementPanel
            roles={roleList}
            selectedByRoleId={selectedByRoleIdRecord}
            allRoles={ALL_ROLES}
            viewDefinitions={VIEW_DEFINITIONS.map((v) => ({ key: v.key, label: v.label }))}
          />
        </Stack>
      ) : null}

      {section === "billing" ? (
        <Stack spacing={2}>
          <AeConsolePanel noPadding>
            <DataTable embedded>
              <TableHead>
                <TableRow>
                  <TableCell>Organization</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {organizationRows.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>{org.name}</TableCell>
                    <TableCell>
                      <form action={updateOrgPlanAction}>
                        <input type="hidden" name="orgId" value={org.id} />
                        <Stack direction="row" spacing={1}>
                          <TextField select size="small" name="plan_code" defaultValue={org.plan_code}>
                            {planOptions.map((p) => (
                              <MenuItem key={p.code} value={p.code}>
                                {p.name}
                              </MenuItem>
                            ))}
                          </TextField>
                          <Button type="submit" size="small" variant="outlined">
                            Update
                          </Button>
                        </Stack>
                      </form>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </AeConsolePanel>
          {subs.length > 0 ? (
            <AeConsolePanel>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Stripe subscriptions (read-only)
              </Typography>
              <DataTable embedded>
                <TableHead>
                  <TableRow>
                    <TableCell>Organization</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subs.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <TablePrimaryCell primary={orgNameById.get(s.org_id) ?? s.org_id} />
                      </TableCell>
                      <TableCell>{s.plan_code}</TableCell>
                      <TableCell>
                        {s.status ? <StatusPill label={s.status} /> : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </AeConsolePanel>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No subscription rows yet. Plan changes apply via organization plan above.
            </Typography>
          )}
        </Stack>
      ) : null}

      {section === "support" ? (
        <SupportTicketsConsoleSection
          tickets={tickets}
          providers={supportProviders.map((p) => ({ id: p.id, name: p.name }))}
          technicians={supportTechnicians.map((u) => ({
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            support_provider_id: (u as { support_provider_id?: string | null }).support_provider_id ?? null,
          }))}
          orgNameById={orgNameById}
        />
      ) : null}

      {section === "support_providers" ? (
        <SupportProvidersConsoleSection
          providers={supportProviders}
          technicians={supportTechnicians.map((u) => ({
            id: u.id,
            email: u.email,
            full_name: u.full_name,
            support_provider_id: (u as { support_provider_id?: string | null }).support_provider_id ?? null,
            created_at: u.created_at,
          }))}
          pendingInvites={pendingTechInvites.map((inv) => ({
            id: inv.id,
            email: inv.email,
            full_name: inv.full_name,
            support_provider_id: inv.support_provider_id,
            created_at: inv.created_at,
          }))}
        />
      ) : null}

      {section === "vendors" ? (
        <VendorSection
          tab={vendorTab}
          vendorApps={vendorApps as VendorApplicationRow[]}
          vendorsList={vendorsList}
          vendorProducts={vendorProducts}
          status={status}
        />
      ) : null}

      {section === "training" ? (
        <Stack spacing={2}>
          <AeConsolePanel>
            <Stack component="form" action={upsertTrainingCourseAction} spacing={2}>
              <TextField name="title" label="Course title" required size="small" />
              <TextField name="slug" label="Slug" size="small" />
              <TextField name="category" label="Category" size="small" defaultValue="General" />
              <TextField name="description" label="Description" multiline rows={2} size="small" />
              <FormControlLabel control={<Checkbox name="is_published" />} label="Published" />
              <Button type="submit" variant="contained">
                Save course
              </Button>
            </Stack>
          </AeConsolePanel>
          {courses.map((c) => (
            <AeConsolePanel key={c.id}>
              <Typography fontWeight={600}>
                {c.title} {c.is_published ? "(live)" : "(draft)"}
              </Typography>
              <Stack component="form" action={addTrainingVideoAction} direction="row" spacing={1} sx={{ mt: 1 }}>
                <input type="hidden" name="courseId" value={c.id} />
                <TextField name="title" label="Video title" size="small" required sx={{ flex: 1 }} />
                <TextField name="video_url" label="Video URL" size="small" sx={{ flex: 1 }} />
                <Button type="submit" size="small">
                  Add video
                </Button>
              </Stack>
            </AeConsolePanel>
          ))}
        </Stack>
      ) : null}

      {section === "jobs" ? (
        <AeConsolePanel noPadding>
          <DataTable embedded>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>{j.title}</TableCell>
                  <TableCell>{j.company_name}</TableCell>
                  <TableCell>
                    <StatusPill label={j.status ?? "active"} />
                  </TableCell>
                  <TableCell>
                    <form action={moderateJobPostAction}>
                      <input type="hidden" name="jobId" value={j.id} />
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField select size="small" name="status" defaultValue={j.status ?? "active"}>
                          <MenuItem value="active">active</MenuItem>
                          <MenuItem value="blocked">blocked</MenuItem>
                          <MenuItem value="closed">closed</MenuItem>
                        </TextField>
                        <FormControlLabel control={<Checkbox name="is_promoted" defaultChecked={j.is_promoted} />} label="Promoted" />
                        <Button type="submit" size="small">
                          Save
                        </Button>
                      </Stack>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </AeConsolePanel>
      ) : null}

      {section === "community" ? (
        <Stack spacing={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Posts
          </Typography>
          {posts.map((p) => (
            <AeConsolePanel key={p.id} sx={{ p: 1.75 }}>
              <Typography variant="body2" noWrap sx={{ maxWidth: 600 }}>
                {p.body.slice(0, 120)}
              </Typography>
              <Chip size="small" label={p.moderation_status ?? "visible"} sx={{ mr: 1, mt: 0.5 }} />
              <form action={moderateCommunityPostAction} style={{ display: "inline" }}>
                <input type="hidden" name="postId" value={p.id} />
                <TextField select size="small" name="moderation_status" defaultValue={p.moderation_status ?? "visible"} sx={{ minWidth: 120, mr: 1 }}>
                  <MenuItem value="visible">visible</MenuItem>
                  <MenuItem value="hidden">hidden</MenuItem>
                  <MenuItem value="blocked">blocked</MenuItem>
                </TextField>
                <Button type="submit" size="small">
                  Apply
                </Button>
              </form>
            </AeConsolePanel>
          ))}
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Comments
          </Typography>
          {comments.map((c) => (
            <AeConsolePanel key={c.id} sx={{ p: 1.75 }}>
              <Typography variant="body2" noWrap>
                {c.body.slice(0, 80)}
              </Typography>
              <form action={moderateCommunityCommentAction} style={{ marginTop: 4 }}>
                <input type="hidden" name="commentId" value={c.id} />
                <TextField select size="small" name="moderation_status" defaultValue={c.moderation_status ?? "visible"} sx={{ minWidth: 120, mr: 1 }}>
                  <MenuItem value="visible">visible</MenuItem>
                  <MenuItem value="hidden">hidden</MenuItem>
                  <MenuItem value="blocked">blocked</MenuItem>
                </TextField>
                <Button type="submit" size="small">
                  Apply
                </Button>
              </form>
            </AeConsolePanel>
          ))}
        </Stack>
      ) : null}

      {section === "ads" ? (
        <Stack spacing={2}>
          <AeConsolePanel>
            <Stack component="form" action={upsertAdPlacementAction} spacing={2}>
              <TextField name="slot_key" label="Slot key" required size="small" placeholder="marketing_home_leaderboard" />
              <TextField name="title" label="Title" size="small" />
              <TextField name="image_url" label="Image URL" size="small" />
              <TextField name="target_url" label="Target URL" size="small" />
              <TextField name="sort_order" label="Sort" size="small" type="number" defaultValue={0} />
              <FormControlLabel control={<Checkbox name="is_active" defaultChecked />} label="Active" />
              <Button type="submit" variant="contained">
                Add placement
              </Button>
            </Stack>
          </AeConsolePanel>
          {ads.map((ad) => (
            <AeConsolePanel key={ad.id} sx={{ p: 1.75 }}>
              <Typography variant="body2">
                <strong>{ad.slot_key}</strong> — {ad.title || "(no title)"} {ad.is_active ? "" : "(inactive)"}
              </Typography>
            </AeConsolePanel>
          ))}
        </Stack>
      ) : null}

      {section === "settings" ? (
        <Stack spacing={2}>
          <AeConsolePanel>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Founder demo requests
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  When a visitor finishes the founder wizard and chooses &quot;Request a demo&quot;, we&apos;ll
                  notify this inbox via Resend. Leave blank to disable demo notifications.
                </Typography>
              </Box>
              <Stack
                component="form"
                action={updateDemoRequestEmailAction}
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ sm: "flex-start" }}
              >
                <TextField
                  name="demo_request_email"
                  label="Notification email"
                  type="email"
                  size="small"
                  fullWidth
                  defaultValue={demoRequestEmail}
                  placeholder="team@aquaticsempowered.com"
                />
                <Button type="submit" variant="contained" sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>
                  Save
                </Button>
              </Stack>
              {demoRequestEmail ? (
                <Typography variant="caption" color="text.secondary">
                  Current recipient: <strong>{demoRequestEmail}</strong>
                </Typography>
              ) : (
                <Typography variant="caption" color="warning.main">
                  No recipient configured — demo requests are saved but no email is sent.
                </Typography>
              )}
            </Stack>
          </AeConsolePanel>
        </Stack>
      ) : null}
        </Stack>
      </AeConsoleContentFrame>
    </Stack>
  );
}
