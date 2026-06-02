import { Box, Container, Link as MuiLink, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { BRAND_NAVY } from "@/components/community/communityUi";

export type LegalDocumentSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export function LegalDocumentPage({
  title,
  effectiveDate,
  intro,
  sections,
  footerLinks,
}: {
  title: string;
  effectiveDate: string;
  intro: string;
  sections: LegalDocumentSection[];
  footerLinks?: { href: string; label: string }[];
}) {
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
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Effective {effectiveDate}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, lineHeight: 1.65 }}>
            {intro}
          </Typography>
        </Stack>

        <Stack spacing={4}>
          {sections.map((section) => (
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

        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 6 }}>
          {footerLinks?.map((link) => (
            <Typography key={link.href} variant="body2" color="text.secondary">
              <MuiLink component={Link} href={link.href} underline="hover">
                {link.label}
              </MuiLink>
            </Typography>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
