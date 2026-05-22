import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type FounderDemoRequestProps = {
  contactName: string;
  email: string;
  facilityName: string;
  facilityTier: string;
  phone?: string | null;
  websiteUrl?: string | null;
  address?: string | null;
  numPools?: number | null;
  message?: string | null;
  currentPain?: string | null;
  submittedAt: string;
};

export default function FounderDemoRequestEmail({
  contactName,
  email,
  facilityName,
  facilityTier,
  phone,
  websiteUrl,
  address,
  numPools,
  message,
  currentPain,
  submittedAt,
}: FounderDemoRequestProps) {
  return (
    <Html>
      <Head />
      <Preview>
        New founder demo request from {contactName} ({facilityName})
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerBlock}>
            <Text style={eyebrow}>FOUNDER PROGRAM</Text>
            <Heading style={h1}>New demo request</Heading>
            <Text style={subtitle}>
              {contactName} from <strong>{facilityName}</strong> wants to talk to the team.
            </Text>
          </Section>

          <Section style={card}>
            <Heading style={h2}>Contact</Heading>
            <Row>
              <Field label="Name" value={contactName} />
              <Field label="Email" value={email} />
            </Row>
            <Row>
              <Field label="Phone" value={phone || "—"} />
              <Field label="Facility type" value={facilityTier} />
            </Row>
          </Section>

          <Section style={card}>
            <Heading style={h2}>Facility</Heading>
            <Row>
              <Field label="Facility name" value={facilityName} />
              <Field label="Bodies of water" value={numPools ? String(numPools) : "—"} />
            </Row>
            <Row>
              <Field label="Website" value={websiteUrl || "—"} />
              <Field label="Address" value={address || "—"} />
            </Row>
          </Section>

          {(message || currentPain) && (
            <Section style={card}>
              <Heading style={h2}>What they shared</Heading>
              {currentPain && (
                <>
                  <Text style={label}>Operational pain</Text>
                  <Text style={paragraph}>{currentPain}</Text>
                </>
              )}
              {message && (
                <>
                  <Text style={label}>Message</Text>
                  <Text style={paragraph}>{message}</Text>
                </>
              )}
            </Section>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            Submitted {submittedAt} · Aquatics Empowered Founder Program
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function Field({ label: l, value }: { label: string; value: string }) {
  return (
    <td style={cell}>
      <Text style={label}>{l}</Text>
      <Text style={fieldValue}>{value}</Text>
    </td>
  );
}

const main = { backgroundColor: "#f5f7fa", fontFamily: "Inter, sans-serif" };
const container = { margin: "0 auto", padding: "32px 20px", maxWidth: "600px" };
const headerBlock = { padding: "16px 4px 24px" };
const eyebrow = { color: "#2EA5A0", fontSize: "12px", letterSpacing: "0.16em", fontWeight: 700, margin: 0 };
const h1 = { color: "#003B6F", fontSize: "28px", margin: "8px 0 6px", lineHeight: "32px" };
const h2 = {
  color: "#0f172a",
  fontSize: "14px",
  margin: "0 0 12px",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
};
const subtitle = { color: "#475569", fontSize: "15px", margin: 0, lineHeight: "22px" };
const card = {
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  padding: "20px 22px",
  marginBottom: "16px",
  boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
};
const cell = { padding: "6px 12px 6px 0", verticalAlign: "top" as const };
const label = { color: "#64748b", fontSize: "11px", letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" as const, fontWeight: 600 };
const fieldValue = { color: "#0f172a", fontSize: "15px", margin: "2px 0 0", fontWeight: 500 };
const paragraph = { color: "#0f172a", fontSize: "15px", lineHeight: "22px", margin: "4px 0 12px" };
const hr = { borderColor: "#e2e8f0", margin: "16px 0" };
const footer = { color: "#94a3b8", fontSize: "12px", textAlign: "center" as const };
