export type ShockResult = {
  needed: boolean;
  combinedChlorine: number;
  shockOzLiquid12: number;
  message: string;
};

/** Breakpoint chlorination estimate using liquid 12.5% chlorine. */
export function calculateShock(input: {
  volumeGallons: number;
  freeChlorine: number;
  totalChlorine: number;
}): ShockResult {
  const cc = Math.max(0, input.totalChlorine - input.freeChlorine);
  const needed = cc > 0.5;
  if (!needed) {
    return {
      needed: false,
      combinedChlorine: cc,
      shockOzLiquid12: 0,
      message: "Combined chlorine is within normal range.",
    };
  }
  const shockPpm = cc * 10;
  const shockOz = (shockPpm * input.volumeGallons) / 10000;
  return {
    needed: true,
    combinedChlorine: Math.round(cc * 100) / 100,
    shockOzLiquid12: Math.round(shockOz * 10) / 10,
    message: `Raise free chlorine to breakpoint; combined Cl is ${cc.toFixed(2)} ppm.`,
  };
}
