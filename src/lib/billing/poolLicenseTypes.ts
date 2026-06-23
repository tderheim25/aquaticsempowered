export type PoolLicenseSnapshot = {
  billingRootId: string;
  purchased: number;
  assigned: number;
  available: number;
  activePoolCount: number;
};

export function computePoolLicenseAvailability(
  purchased: number,
  activePoolCount: number,
  billingRootId = "",
): PoolLicenseSnapshot {
  const assigned = Math.max(0, activePoolCount - 1);
  const available = Math.max(0, purchased - assigned);
  return {
    billingRootId,
    purchased,
    assigned,
    available,
    activePoolCount,
  };
}
