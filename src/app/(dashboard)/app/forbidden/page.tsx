import { Alert, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

export const metadata = {
  title: "Access Denied | Aquatics Empowered",
};

function prettyViewName(view?: string) {
  if (!view) return null;
  return view.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const viewLabel = prettyViewName(view);

  return (
    <Container maxWidth="sm">
      <Card variant="outlined" sx={{ mt: 4 }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Access denied
            </Typography>
            <Alert severity="warning">You do not have permission to access this page.</Alert>
            {viewLabel ? (
              <Typography variant="body2" color="text.secondary">
                Requested view: <strong>{viewLabel}</strong>
              </Typography>
            ) : null}
            <Stack direction="row" spacing={1}>
              <Button component={Link} href="/app" variant="contained">
                Back to dashboard
              </Button>
              <Button variant="outlined" disabled>
                Contact administrator
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

