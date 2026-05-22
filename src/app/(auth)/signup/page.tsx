import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupPageContent } from "@/components/auth/SignupPageContent";
import { loadInvitationByToken } from "@/lib/orgInvitations";
import { loadTechnicianInvitationByToken } from "@/lib/supportTechnicianInvitations";

export const metadata = {
  title: "Create account | Aquatics Empowered",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; invite?: string }>;
}) {
  const { next, invite: inviteToken } = await searchParams;

  const [orgInvite, techInvite] = inviteToken
    ? await Promise.all([
        loadInvitationByToken(inviteToken),
        loadTechnicianInvitationByToken(inviteToken),
      ])
    : [null, null];

  const invite = orgInvite ?? techInvite;
  const isTechnician = Boolean(techInvite && !orgInvite);
  const acceptNext = isTechnician ? "/portal/queue" : "/app";

  const nextPath = invite
    ? `/app/invitations/accept?token=${encodeURIComponent(inviteToken!)}&next=${encodeURIComponent(acceptNext)}`
    : next && next.startsWith("/")
      ? next
      : "/app";

  const inviteExpired = Boolean(inviteToken && !invite);

  const title = orgInvite
    ? `Join ${orgInvite.orgName}`
    : techInvite
      ? `Join ${techInvite.providerName}`
      : "Create account";
  const subtitle = orgInvite
    ? `Create your account to accept the invitation from ${orgInvite.inviterName ?? "your team"} as ${orgInvite.roleLabel}.`
    : techInvite
      ? `Create your account to work as a support technician for ${techInvite.providerName}.`
      : "Set up your account with email and password.";

  const inviteEmail = orgInvite?.email ?? techInvite?.email;
  const inviteFullName = orgInvite?.fullName ?? techInvite?.fullName ?? undefined;

  const signInHref = invite
    ? `/login?next=${encodeURIComponent(`/app/invitations/accept?token=${encodeURIComponent(inviteToken!)}&next=${encodeURIComponent(acceptNext)}`)}`
    : "/login";

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      <SignupPageContent
        nextPath={nextPath}
        inviteToken={invite ? inviteToken : undefined}
        inviteEmail={inviteEmail}
        inviteFullName={inviteFullName}
        inviteExpired={inviteExpired}
        orgInvite={
          orgInvite
            ? {
                orgName: orgInvite.orgName,
                roleLabel: orgInvite.roleLabel,
                inviterName: orgInvite.inviterName,
                message: orgInvite.message,
              }
            : null
        }
        techInvite={
          techInvite
            ? {
                providerName: techInvite.providerName,
                inviterName: techInvite.inviterName,
                message: techInvite.message,
              }
            : null
        }
        signInHref={signInHref}
      />
    </AuthLayout>
  );
}
