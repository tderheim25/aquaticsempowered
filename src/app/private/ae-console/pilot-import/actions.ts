"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdminConsole } from "@/lib/auth/superAdminPortal";
import { getSuperAdminPortalPath } from "@/lib/auth/superAdminPortalConstants";
import { runPilotBulkImport } from "@/lib/pilot/bulkImport";
import { sendPilotProgramWelcome } from "@/lib/resend";

export type PilotImportActionResult = Awaited<ReturnType<typeof runPilotBulkImport>>;

export async function previewPilotImportAction(csvText: string): Promise<PilotImportActionResult> {
  await requireSuperAdminConsole();
  return runPilotBulkImport({ csvText, dryRun: true });
}

export async function runPilotImportAction(
  csvText: string,
  sendWelcomeEmails: boolean,
): Promise<PilotImportActionResult> {
  await requireSuperAdminConsole();

  const result = await runPilotBulkImport({
    csvText,
    dryRun: false,
    sendWelcomeEmails,
    sendWelcomeEmail: async (params) => {
      await sendPilotProgramWelcome(params.to, {
        recipientName: params.recipientName,
        orgName: params.orgName,
        roleLabel: params.roleLabel,
        email: params.email,
        tempPassword: params.tempPassword,
        accessUntilLabel: params.accessUntilLabel,
      });
    },
  });

  revalidatePath(getSuperAdminPortalPath());
  revalidatePath("/app");
  return result;
}
