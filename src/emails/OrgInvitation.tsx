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

export type OrgInvitationProps = {
  orgName: string;
  inviterName: string;
  recipientName?: string | null;
  roleLabel: string;
  signupUrl: string;
  appUrl: string;
  isExistingUser: boolean;
  message?: string | null;
  expiresAt: string;
};

export default function OrgInvitationEmail({
  orgName,
  inviterName,
  recipientName,
  roleLabel,
  signupUrl,
  appUrl,
  isExistingUser,
  message,
  expiresAt,
}: OrgInvitationProps) {
  const greetingName = recipientName?.trim() ? recipientName.split(" ")[0] : "there";
  const ctaUrl = isExistingUser ? appUrl : signupUrl;
  const ctaLabel = isExistingUser ? "Open your dashboard" : "Create your account";

  return (
    <Html>
      <Head />
      <Preview>{`You're invited to join ${orgName} on Aquatics Empowered`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerBlock}>
            <Text style={eyebrow}>TEAM INVITATION</Text>
            <Heading style={h1}>Join {orgName}</Heading>
            <Text style={subtitle}>
              Hi {greetingName} — <strong>{inviterName}</strong> invited you to collaborate as{" "}
              <strong>{roleLabel}</strong> on Aquatics Empowered.
            </Text>
          </Section>

          <Section style={card}>
            {isExistingUser ? (
              <>
                <Text style={paragraph}>
                  We noticed you already have an Aquatics Empowered account. Sign in and you&apos;ll see the
                  invitation waiting in your notifications — tap <strong>Accept</strong> to join {orgName}.
                </Text>
                <Button href={ctaUrl} style={button}>
                  {ctaLabel}
                </Button>
              </>
            ) : (
              <>
                <Text style={paragraph}>
                  Click the button below to create your Aquatics Empowered account. We&apos;ll link you to{" "}
                  {orgName} as <strong>{roleLabel}</strong> the moment you finish.
                </Text>
                <Button href={ctaUrl} style={button}>
                  {ctaLabel}
                </Button>
                <Text style={fallbackText}>
                  Or paste this link into your browser:
                  <br />
                  <span style={mono}>{ctaUrl}</span>
                </Text>
              </>
            )}

            {message && (
              <>
                <Hr style={hr} />
                <Text style={label}>Note from {inviterName}</Text>
                <Text style={paragraph}>{message}</Text>
              </>
            )}
          </Section>

          <Text style={footer}>
            This invitation expires on {expiresAt}. If you weren&apos;t expecting it, you can safely
            ignore this email.
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
const paragraph = { color: "#0f172a", fontSize: "15px", lineHeight: "22px", margin: "0 0 16px" };
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
  fontSize: "12px",
  wordBreak: "break-all" as const,
};
const label = { color: "#64748b", fontSize: "11px", letterSpacing: "0.08em", margin: "0 0 4px", textTransform: "uppercase" as const, fontWeight: 600 };
const hr = { borderColor: "#e2e8f0", margin: "16px 0" };
const footer = { color: "#94a3b8", fontSize: "12px", textAlign: "center" as const, marginTop: "8px" };
