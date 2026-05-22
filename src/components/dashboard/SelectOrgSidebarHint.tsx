import { Alert } from "@mui/material";

export function SelectOrgSidebarHint({ superAdmin }: { superAdmin?: boolean }) {
  return (
    <Alert severity="info">
      {superAdmin
        ? "Select an organization in the sidebar to work in that facility’s context."
        : "Your account is not linked to an organization yet."}
    </Alert>
  );
}
