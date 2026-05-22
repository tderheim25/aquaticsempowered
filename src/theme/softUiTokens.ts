/**
 * Soft-UI design tokens for dashboard surfaces.
 *
 * Inspired by modern pastel admin dashboards (Soft UI / Aurora Gradient),
 * but tinted toward Aquatics Empowered's aquatic identity (light aqua,
 * mint, coral, amber) so the look still feels professional and on-brand
 * for pool & spa operations.
 *
 * Use these for:
 *   - The Super Admin Console (`/private/ae-console`)
 *   - The operator dashboard welcome banner & KPI strip (`/app`)
 *
 * Do NOT use for dense data tables, chemistry forms, or compliance
 * surfaces — those should stay on the default `appTheme` for contrast
 * and density.
 */
export const softUiTokens = {
  /** Background gradient stops for "soft surface" pages. */
  background: {
    gradient: "linear-gradient(135deg, #F0F7FA 0%, #EEF4F9 45%, #F5EFF6 100%)",
    gradientStart: "#F0F7FA",
    gradientMid: "#EEF4F9",
    gradientEnd: "#F5EFF6",
    card: "#FFFFFF",
    /** Subtle wash for elevated surfaces above the gradient. */
    cardSoft: "rgba(255, 255, 255, 0.72)",
  },

  /**
   * Vibrant pastel accents for radial indicators, badges, and trend rings.
   * Each accent has a `ring` (saturated) and `bg` (10% tint) variant.
   */
  accent: {
    aqua: { ring: "#2EA5A0", bg: "rgba(46, 165, 160, 0.12)", soft: "#D7EEEC" },
    coral: { ring: "#FF8A65", bg: "rgba(255, 138, 101, 0.12)", soft: "#FFE4DA" },
    amber: { ring: "#FFB74D", bg: "rgba(255, 183, 77, 0.14)", soft: "#FFEFD6" },
    violet: { ring: "#9575CD", bg: "rgba(149, 117, 205, 0.12)", soft: "#E5DCF3" },
    mint: { ring: "#66BB6A", bg: "rgba(102, 187, 106, 0.12)", soft: "#DCEEDC" },
    sky: { ring: "#4FC3F7", bg: "rgba(79, 195, 247, 0.12)", soft: "#D8EEFB" },
    navy: { ring: "#003B6F", bg: "rgba(0, 59, 111, 0.10)", soft: "#D5DEE9" },
  },

  /** Long shadows tinted slightly navy to feel "lifted off the gradient". */
  shadow: {
    card: "0 1px 2px rgba(0, 59, 111, 0.04), 0 4px 16px rgba(0, 59, 111, 0.04)",
    cardHover: "0 6px 14px rgba(0, 59, 111, 0.08), 0 14px 32px rgba(0, 59, 111, 0.06)",
    raised: "0 8px 24px rgba(0, 59, 111, 0.08)",
  },

  /** Larger radii give the cards their pillowy/rounded feel. */
  radius: {
    card: 20,
    pill: 999,
    chip: 12,
  },

  /** Text tones that read well on the soft pastel gradient. */
  text: {
    primary: "#0F2336",
    secondary: "#4B5C70",
    muted: "#7A8699",
  },
} as const;

export type SoftAccent = keyof typeof softUiTokens.accent;

/**
 * Cycle through the accent palette in a predictable order so a row of
 * stat cards gets visually varied colors without you having to pick.
 */
export const SOFT_ACCENT_CYCLE: readonly SoftAccent[] = [
  "aqua",
  "coral",
  "amber",
  "violet",
  "mint",
  "sky",
  "navy",
] as const;
