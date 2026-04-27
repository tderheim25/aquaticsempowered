import { Container, Typography } from "@mui/material";

export const metadata = {
  title: "Vendor partners | Aquatics Empowered",
};

export default function VendorsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
        Certified vendor network
      </Typography>
      <Typography variant="body1" color="text.secondary">
        The Aquatics Empowered Certified Partner™ program is coming soon. Equipment manufacturers, service providers,
        chemical suppliers, and safety partners will be listed here with verified credentials and regional coverage.
      </Typography>
    </Container>
  );
}
