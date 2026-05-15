/**
 * Langelier Saturation Index (LSI) for pool water — common industry approximation.
 * LSI = pH(actual) − pH(saturation). Values roughly > +0.3 suggest scaling tendency;
 * < −0.3 suggest corrosive tendency (rule-of-thumb ranges vary by operator).
 *
 * Uses total alkalinity and calcium hardness as CaCO₃ (ppm), temperature in °F, and TDS (ppm).
 */
export function calculateLangelierSaturationIndex(input: {
  tempF: number;
  ph: number;
  alkalinityPpm: number;
  calciumHardnessPpm: number;
  tdsPpm: number;
}): number | null {
  const { tempF, ph, alkalinityPpm, calciumHardnessPpm, tdsPpm } = input;
  if (![tempF, ph, alkalinityPpm, calciumHardnessPpm, tdsPpm].every((n) => typeof n === "number" && Number.isFinite(n) && n > 0)) {
    return null;
  }
  const tempC = ((tempF - 32) * 5) / 9;
  const tempK = tempC + 273.15;
  const A = (Math.log10(tdsPpm) - 1) / 10;
  const B = -13.12 * Math.log10(tempK) + 34.55;
  const C = Math.log10(calciumHardnessPpm) - 0.4;
  const D = Math.log10(alkalinityPpm);
  const pHs = 9.3 + A + B - (C + D);
  const lsi = ph - pHs;
  return Math.round(lsi * 100) / 100;
}
