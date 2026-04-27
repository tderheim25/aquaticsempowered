import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

export type MagicLinkProps = {
  signInUrl: string;
};

export default function MagicLinkEmail({ signInUrl }: MagicLinkProps) {
  return (
    <Html>
      <Head />
      <Preview>Your secure sign-in link for Aquatics Empowered</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Sign in to Aquatics Empowered</Heading>
          <Text style={text}>Click the button below to finish signing in. This link expires shortly.</Text>
          <Button href={signInUrl} style={button}>
            Sign in
          </Button>
          <Text style={muted}>
            If you didn&apos;t request this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f5f7fa", fontFamily: "Inter, sans-serif" };
const container = { margin: "0 auto", padding: "40px 20px", maxWidth: "520px" };
const h1 = { color: "#003B6F", fontSize: "24px", margin: "0 0 12px" };
const text = { color: "#0f172a", fontSize: "15px", lineHeight: "22px" };
const button = {
  backgroundColor: "#003B6F",
  borderRadius: "10px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  display: "block",
  padding: "14px 24px",
  marginTop: "24px",
};
const muted = { color: "#64748b", fontSize: "13px", marginTop: "28px" };
