import { render } from "@react-email/render";
import { Resend } from "resend";

import FounderDemoRequestEmail, {
  type FounderDemoRequestProps,
} from "@/emails/FounderDemoRequest";
import FounderWelcomeEmail, { type FounderWelcomeProps } from "@/emails/FounderWelcome";
import MagicLinkEmail, { type MagicLinkProps } from "@/emails/MagicLink";
import OrgInvitationEmail, { type OrgInvitationProps } from "@/emails/OrgInvitation";
import PilotProgramWelcomeEmail, {
  type PilotProgramWelcomeProps,
} from "@/emails/PilotProgramWelcome";
import SupportTechnicianInvitationEmail, {
  type SupportTechnicianInvitationProps,
} from "@/emails/SupportTechnicianInvitation";

const resend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
};

const from = () => {
  const email = process.env.RESEND_FROM_EMAIL;
  if (!email) throw new Error("Missing RESEND_FROM_EMAIL");
  return email;
};

type ResendSendResult = Awaited<ReturnType<ReturnType<typeof resend>["emails"]["send"]>>;

/** Resend returns `{ error }` without throwing — callers must check the result. */
function assertEmailSent(result: ResendSendResult, context: string) {
  if (result.error) {
    const msg = result.error.message ?? "Resend rejected the email";
    throw new Error(`${context}: ${msg}`);
  }
}

export async function sendFounderWelcome(to: string, props: FounderWelcomeProps) {
  const html = await render(FounderWelcomeEmail(props));
  const result = await resend().emails.send({
    from: from(),
    to,
    subject: "Welcome to Aquatics Empowered — Founder Program",
    html,
  });
  assertEmailSent(result, "Founder welcome email");
  return result;
}

export async function sendFounderDemoRequest(to: string, props: FounderDemoRequestProps) {
  const html = await render(FounderDemoRequestEmail(props));
  const result = await resend().emails.send({
    from: from(),
    to,
    replyTo: props.email,
    subject: `Founder demo request — ${props.facilityName}`,
    html,
  });
  assertEmailSent(result, "Founder demo request email");
  return result;
}

export async function sendOrgInvitationEmail(to: string, props: OrgInvitationProps) {
  const html = await render(OrgInvitationEmail(props));
  const result = await resend().emails.send({
    from: from(),
    to,
    subject: `You're invited to join ${props.orgName} on Aquatics Empowered`,
    html,
  });
  assertEmailSent(result, "Org invitation email");
  return result;
}

export async function sendSupportTechnicianInvitationEmail(
  to: string,
  props: SupportTechnicianInvitationProps,
) {
  const html = await render(SupportTechnicianInvitationEmail(props));
  const result = await resend().emails.send({
    from: from(),
    to,
    subject: `Support technician invitation — ${props.providerName}`,
    html,
  });
  assertEmailSent(result, "Support technician invitation email");
  return result;
}

export async function sendPilotProgramWelcome(
  to: string,
  props: Omit<PilotProgramWelcomeProps, "appUrl" | "loginUrl" | "accountSettingsUrl" | "supportEmail">,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://aquaticsempowered.com";
  const html = await render(
    PilotProgramWelcomeEmail({
      ...props,
      appUrl,
      loginUrl: `${appUrl}/login`,
      accountSettingsUrl: `${appUrl}/app/account`,
      supportEmail: process.env.SUPPORT_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? null,
    }),
  );
  const result = await resend().emails.send({
    from: from(),
    to,
    subject: "You're invited to pilot Aquatics Empowered — your login details inside",
    html,
  });
  assertEmailSent(result, "Pilot program welcome email");
  return result;
}

export async function sendMagicLinkPreview(to: string, props: MagicLinkProps) {
  const html = await render(MagicLinkEmail(props));
  const result = await resend().emails.send({
    from: from(),
    to,
    subject: "Your Aquatics Empowered sign-in link",
    html,
  });
  assertEmailSent(result, "Magic link preview email");
  return result;
}
