import { Box, Container, Link as MuiLink, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { BRAND_NAVY } from "@/components/community/communityUi";
import {
  PRIVACY_POLICY_EFFECTIVE_DATE,
  PRIVACY_POLICY_SECTIONS,
} from "@/lib/legal/privacyPolicySections";

export function PrivacyPolicyPageContent() {
  return (
    <Box
      component="article"
      sx={{
        py: { xs: 6, md: 10 },
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={1.5} sx={{ mb: 5 }}>
          <Typography
            component="h1"
            variant="h3"
            sx={{ fontWeight: 800, letterSpacing: "-0.02em", color: BRAND_NAVY }}
          >
            Privacy Policy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Effective {PRIVACY_POLICY_EFFECTIVE_DATE}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, lineHeight: 1.65 }}>
            This policy describes how Aquatics Empowered handles personal information when you use our
            website and software.
          </Typography>
        </Stack>

        <Stack spacing={4}>
          {PRIVACY_POLICY_SECTIONS.map((section) => (
            <Stack key={section.id} id={section.id} spacing={1.25} component="section">
              <Typography
                component="h2"
                variant="h5"
                sx={{ fontWeight: 700, color: BRAND_NAVY, letterSpacing: "-0.01em" }}
              >
                {section.title}
              </Typography>
              {section.paragraphs.map((paragraph) => (
                <Typography
                  key={paragraph}
                  variant="body1"
                  color="text.secondary"
                  sx={{ lineHeight: 1.7 }}
                >
                  {paragraph}
                </Typography>
              ))}
              {section.id === "contact" ? (
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Email:{" "}
                  <MuiLink href="mailto:hello@aquaticsempowered.com" underline="hover">
                    hello@aquaticsempowered.com
                  </MuiLink>
                </Typography>
              ) : null}
              {section.bullets ? (
                <Box component="ul" sx={{ m: 0, pl: 2.5, color: "text.secondary" }}>
                  {section.bullets.map((item) => (
                    <Typography
                      key={item}
                      component="li"
                      variant="body1"
                      sx={{ lineHeight: 1.7, mb: 0.75 }}
                    >
                      {item}
                    </Typography>
                  ))}
                </Box>
              ) : null}
            </Stack>
          ))}
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 6 }}>
          <MuiLink component={Link} href="/login" underline="hover">
            Return to sign in
          </MuiLink>
        </Typography>
      </Container>
    </Box>
  );
}
