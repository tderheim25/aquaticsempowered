import { render } from "@react-email/render";
import { Resend } from "resend";

import FounderWelcomeEmail, { type FounderWelcomeProps } from "@/emails/FounderWelcome";
import MagicLinkEmail, { type MagicLinkProps } from "@/emails/MagicLink";

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

export async function sendFounderWelcome(to: string, props: FounderWelcomeProps) {
  const html = await render(FounderWelcomeEmail(props));
  return resend().emails.send({
    from: from(),
    to,
    subject: "Welcome to Aquatics Empowered — Founder Program",
    html,
  });
}

export async function sendMagicLinkPreview(to: string, props: MagicLinkProps) {
  const html = await render(MagicLinkEmail(props));
  return resend().emails.send({
    from: from(),
    to,
    subject: "Your Aquatics Empowered sign-in link",
    html,
  });
}
