export const COMMUNITY_ENERGY_AUDIT_DAILY_LIMIT = 3;

export type CommunityEnergyAuditUsage = {
  signedIn: boolean;
  limit: number;
  used: number;
  remaining: number;
  atLimit: boolean;
  resetsAt: string;
};
