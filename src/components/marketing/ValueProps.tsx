import PoolIcon from "@mui/icons-material/Pool";
import SavingsIcon from "@mui/icons-material/Savings";
import ShieldIcon from "@mui/icons-material/Shield";
import { Card, CardContent, Container, Stack, Typography } from "@mui/material";

const items = [
  {
    title: "Protect pools",
    body: "Compliance-ready logs, SOPs, and guidance so your team runs safer operations every day.",
    icon: <ShieldIcon color="primary" fontSize="large" />,
  },
  {
    title: "Cut costs",
    body: "Reduce procurement waste, vendor churn, and emergency repairs with trusted buying power.",
    icon: <SavingsIcon color="primary" fontSize="large" />,
  },
  {
    title: "Prevent failures",
    body: "Maintenance templates and expert support catch issues before they become shutdowns.",
    icon: <PoolIcon color="primary" fontSize="large" />,
  },
];

export function ValueProps() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 4, textAlign: "center" }}>
        Built for real-world aquatic operations
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} useFlexGap>
        {items.map((item) => (
          <Card key={item.title} sx={{ flex: 1, minWidth: 0 }}>
            <CardContent>
              <Typography sx={{ mb: 1 }}>{item.icon}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.body}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
