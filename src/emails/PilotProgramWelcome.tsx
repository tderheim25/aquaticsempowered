import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type PilotProgramWelcomeProps = {
  recipientName: string;
  orgName: string;
  roleLabel: string;
  appUrl: string;
  loginUrl: string;
  email: string;
  tempPassword: string;
  accessUntilLabel: string;
  accountSettingsUrl: string;
  supportEmail?: string | null;
};

export default function PilotProgramWelcomeEmail({
  recipientName,
  orgName,
  roleLabel,
  appUrl,
  loginUrl,
  email,
  tempPassword,
  accessUntilLabel,
  accountSettingsUrl,
  supportEmail,
}: PilotProgramWelcomeProps) {
  const greetingName = recipientName?.trim() ? recipientName.split(" ")[0] : "there";

  return (
    <Html>
      <Head />
      <Preview>You&apos;re invited to pilot Aquatics Empowered — your login details inside</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerBlock}>
            <Text style={eyebrow}>PILOT PROGRAM</Text>
            <Heading style={h1}>You&apos;re invited to pilot Aquatics Empowered</Heading>
            <Text style={subtitle}>
              Hi {greetingName} — welcome aboard. Your organization, <strong>{orgName}</strong>, has
              complimentary full access to Aquatics Empowered through {accessUntilLabel}.
            </Text>
          </Section>

          <Section style={card}>
            <Text style={label}>What you can do</Text>
            <Text style={paragraph}>
              Aquatics Empowered helps pool operators run safer, more efficient facilities:
            </Text>
            <Text style={bulletList}>
              • Chemical logs and compliance-ready reports
              <br />
              • Maintenance, inspections, and SOPs
              <br />
              • Team collaboration and support portal
              <br />
              • Procurement and energy tools (enterprise pilot)
            </Text>

            <Hr style={hr} />

            <Text style={label}>Your access</Text>
            <Text style={paragraph}>
              <strong>Organization:</strong> {orgName}
              <br />
              <strong>Role:</strong> {roleLabel}
              <br />
              <strong>Access through:</strong> {accessUntilLabel}
            </Text>

            <Hr style={hr} />

            <Text style={label}>Sign in</Text>
            <Text style={paragraph}>
              <strong>App:</strong> {appUrl}
              <br />
              <strong>Username:</strong> {email}
              <br />
              <strong>Temporary password:</strong>{" "}
              <span style={mono}>{tempPassword}</span>
            </Text>
            <Button href={loginUrl} style={button}>
              Sign in and explore
            </Button>
            <Text style={fallbackText}>
              Or paste this link into your browser:
              <br />
              <span style={mono}>{loginUrl}</span>
            </Text>

            <Hr style={hr} />

            <Text style={securityNote}>
              For security, change your password after your first sign-in from{" "}
              <a href={accountSettingsUrl} style={link}>
                Account settings
              </a>
              . This temporary password is shown only in this email.
            </Text>
          </Section>

          <Text style={footer}>
            Questions? Reply to this email
            {supportEmail ? ` or contact ${supportEmail}` : ""}. We&apos;re excited to have you in the
            pilot.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f5f7fa", fontFamily: "Inter, sans-serif" };
const container = { margin: "0 auto", padding: "32px 20px", maxWidth: "560px" };
const headerBlock = { padding: "16px 4px 24px" };
const eyebrow = { color: "#2EA5A0", fontSize: "12px", letterSpacing: "0.16em", fontWeight: 700, margin: 0 };
const h1 = { color: "#003B6F", fontSize: "28px", margin: "8px 0 6px", lineHeight: "32px" };
const subtitle = { color: "#475569", fontSize: "15px", margin: 0, lineHeight: "22px" };
const card = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "24px 24px",
  marginTop: "8px",
  marginBottom: "16px",
  boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
};
const label = {
  color: "#64748b",
  fontSize: "11px",
  letterSpacing: "0.08em",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
  fontWeight: 600,
};
const paragraph = { color: "#0f172a", fontSize: "15px", lineHeight: "22px", margin: "0 0 16px" };
const bulletList = { color: "#0f172a", fontSize: "15px", lineHeight: "26px", margin: "0 0 16px" };
const button = {
  backgroundColor: "#003B6F",
  borderRadius: "10px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "14px 24px",
  marginTop: "8px",
  marginBottom: "8px",
};
const fallbackText = { color: "#64748b", fontSize: "13px", lineHeight: "20px", margin: "12px 0 0" };
const mono = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "#0f172a",
  fontSize: "13px",
  fontWeight: 600,
};
const hr = { borderColor: "#e2e8f0", margin: "16px 0" };
const securityNote = { color: "#475569", fontSize: "13px", lineHeight: "20px", margin: "0" };
const link = { color: "#003B6F" };
const footer = { color: "#94a3b8", fontSize: "12px", textAlign: "center" as const, marginTop: "8px" };
