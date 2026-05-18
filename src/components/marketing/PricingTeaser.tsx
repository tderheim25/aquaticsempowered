import { Card, CardContent, Container, Stack, Typography } from "@mui/material";

const tiers = [
  { name: "Free Community", price: "$0", blurb: "Forum" },
  { name: "Essential", price: "$149/mo", blurb: "Logs, SOPs, support portal" },
  { name: "Professional", price: "$499/mo", blurb: "Audits, procurement, vendor guidance" },
  { name: "Enterprise", price: "From $1,500/mo", blurb: "Monitoring, advisory, capital planning" },
];

export function PricingTeaser() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 3, textAlign: "center" }}>
        Membership tiers
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap" useFlexGap>
        {tiers.map((t) => (
          <Card key={t.name} sx={{ flex: "1 1 200px", minWidth: 180 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                {t.name}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, my: 1 }}>
                {t.price}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t.blurb}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
