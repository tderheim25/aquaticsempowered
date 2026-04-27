import { Container, Typography } from "@mui/material";

export const metadata = {
  title: "Community | Aquatics Empowered",
};

export default function CommunityPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
        Free community access
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Discussion forum, resources, webinars, and vendor reviews for operators who want to learn together — launching
        with the full platform roadmap.
      </Typography>
    </Container>
  );
}
