import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type FounderWelcomeProps = {
  contactName: string;
  facilityName: string;
};

export default function FounderWelcomeEmail({ contactName, facilityName }: FounderWelcomeProps) {
  const first = contactName.split(" ")[0] || contactName;
  return (
    <Html>
      <Head />
      <Preview>Welcome to the Aquatics Empowered Founder Program</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You&apos;re in, {first}</Heading>
          <Text style={text}>
            Thanks for raising your hand for <strong>{facilityName}</strong>. Our team will follow up
            with founder pricing, onboarding, and early access to the platform dashboard.
          </Text>
          <Section style={list}>
            <Text style={bullet}>• Preferred founder pricing &amp; terms</Text>
            <Text style={bullet}>• Direct line to our founding team</Text>
            <Text style={bullet}>• Shape the roadmap for your facility type</Text>
          </Section>
          <Button href="https://aquaticsempowered.com" style={button}>
            Visit Aquatics Empowered
          </Button>
          <Text style={footer}>Aquatics Empowered™ — peace of mind for every pool.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f5f7fa", fontFamily: "Inter, sans-serif" };
const container = { margin: "0 auto", padding: "40px 20px", maxWidth: "560px" };
const h1 = { color: "#003B6F", fontSize: "28px", margin: "0 0 16px" };
const text = { color: "#0f172a", fontSize: "16px", lineHeight: "24px" };
const list = { marginTop: "24px" };
const bullet = { color: "#0f172a", fontSize: "15px", margin: "6px 0" };
const button = {
  backgroundColor: "#2EA5A0",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "14px 24px",
  marginTop: "28px",
};
const footer = { color: "#64748b", fontSize: "13px", marginTop: "32px" };
