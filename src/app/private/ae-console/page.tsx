import { AeConsolePageContent } from "./AeConsolePageContent";
import { requireSuperAdminConsole } from "@/lib/auth/superAdminPortal";

export default async function AeConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; status?: string; roleId?: string; tab?: string; code?: string }>;
}) {
  await requireSuperAdminConsole();
  const params = await searchParams;
  return <AeConsolePageContent searchParams={params} />;
}
