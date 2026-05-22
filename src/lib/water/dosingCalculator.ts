export type DoseRecommendation = {
  chemical: string;
  amount: number;
  unit: string;
  note?: string;
};

/** Simplified pool dosing estimates (informational; follow product labels). */
export function calculateDosing(input: {
  volumeGallons: number;
  ph?: number | null;
  freeChlorine?: number | null;
  totalAlkalinity?: number | null;
  calciumHardness?: number | null;
  cyanuricAcid?: number | null;
  targets: {
    ph?: { min: number; max: number; ideal?: number };
    free_chlorine?: { min: number; max: number; ideal?: number };
    total_alkalinity?: { min: number; max: number; ideal?: number };
    calcium_hardness?: { min: number; max: number; ideal?: number };
    cyanuric_acid?: { min: number; max: number; ideal?: number };
  };
}): DoseRecommendation[] {
  const vol = input.volumeGallons;
  if (!vol || vol <= 0) return [];
  const out: DoseRecommendation[] = [];
  const fcTarget = input.targets.free_chlorine?.ideal ?? 3;
  const taTarget = input.targets.total_alkalinity?.ideal ?? 100;
  const phTarget = input.targets.ph?.ideal ?? 7.4;
  const chTarget = input.targets.calcium_hardness?.ideal ?? 375;
  const cyaTarget = input.targets.cyanuric_acid?.ideal ?? 50;

  if (input.freeChlorine != null && input.freeChlorine < (input.targets.free_chlorine?.min ?? 1)) {
    const ppmNeeded = fcTarget - input.freeChlorine;
    const oz12 = (ppmNeeded * vol) / 10000;
    out.push({
      chemical: "Liquid chlorine (12.5%)",
      amount: Math.round(oz12 * 10) / 10,
      unit: "fl oz",
      note: "Add with pump running; retest in 30 min.",
    });
  }

  if (input.ph != null && input.ph > (input.targets.ph?.max ?? 7.6)) {
    const drops = Math.round(((input.ph - phTarget) * vol) / 10);
    out.push({
      chemical: "Muriatic acid (31.45%)",
      amount: Math.max(1, Math.round(drops / 16)),
      unit: "fl oz",
      note: "Lowers pH; may lower alkalinity.",
    });
  } else if (input.ph != null && input.ph < (input.targets.ph?.min ?? 7.2)) {
    out.push({
      chemical: "Soda ash",
      amount: Math.round(((phTarget - input.ph) * vol) / 50),
      unit: "oz",
      note: "Raises pH; may raise alkalinity.",
    });
  }

  if (input.totalAlkalinity != null && input.totalAlkalinity < (input.targets.total_alkalinity?.min ?? 80)) {
    out.push({
      chemical: "Sodium bicarbonate",
      amount: Math.round(((taTarget - input.totalAlkalinity) * vol) / 7000),
      unit: "lb",
    });
  }

  if (input.calciumHardness != null && input.calciumHardness < (input.targets.calcium_hardness?.min ?? 250)) {
    out.push({
      chemical: "Calcium chloride",
      amount: Math.round(((chTarget - input.calciumHardness) * vol) / 10000),
      unit: "lb",
    });
  }

  if (input.cyanuricAcid != null && input.cyanuricAcid < (input.targets.cyanuric_acid?.min ?? 30)) {
    out.push({
      chemical: "Cyanuric acid",
      amount: Math.round(((cyaTarget - input.cyanuricAcid) * vol) / 12000),
      unit: "lb",
      note: "Stabilizer; dissolves slowly.",
    });
  }

  return out;
}
