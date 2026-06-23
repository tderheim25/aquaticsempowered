import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

import { FOUNDER_TRUST_FAQ } from "@/lib/founders/founderProgram";

export function FounderTrustSidebar() {
  return (
    <Stack spacing={2}>
      <Typography variant="overline" sx={{ color: "secondary.main", fontWeight: 700, letterSpacing: "0.16em" }}>
        What founders get
      </Typography>

      <Card
        variant="outlined"
        sx={{ borderRadius: 3, borderColor: "divider", backgroundColor: "background.paper" }}
      >
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Not sure yet?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Request a demo on the last step of the application. We&apos;ll reach out within two business days
            with a personalized walkthrough and founder pricing tailored to your facility.
          </Typography>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        {FOUNDER_TRUST_FAQ.map((item) => (
          <Box key={item.q}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {item.q}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
              {item.a}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
