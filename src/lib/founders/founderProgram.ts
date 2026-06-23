import type { SvgIconComponent } from "@mui/icons-material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";

export const FOUNDER_FACILITY_LIMIT = 50;

export const FOUNDER_DISCOUNT_TERM = "for 3 years";

export const FOUNDER_DISCOUNT_YEARS = 3;

export const FOUNDER_DISCOUNT_BADGE = `50% off ${FOUNDER_DISCOUNT_TERM}`;

export function founderDiscountEndsAt(enrolledAt: string): Date {
  const end = new Date(enrolledAt);
  end.setUTCFullYear(end.getUTCFullYear() + FOUNDER_DISCOUNT_YEARS);
  return end;
}

/** True when org/user is tagged founder and the 3-year window from enrollment has not ended. */
export function isFounderDiscountActive(
  enrolledAt: string | null,
  isTaggedFounder: boolean,
  now: Date = new Date(),
): boolean {
  if (!isTaggedFounder) return false;
  if (!enrolledAt) return true;
  return now < founderDiscountEndsAt(enrolledAt);
}

export const FOUNDER_SCARCITY_LABEL = `Limited to the first ${FOUNDER_FACILITY_LIMIT} founder facilities nationwide`;

export const FOUNDER_HERO_HEADLINE = `Join the first 50 aquatics founders — 50% off, ${FOUNDER_DISCOUNT_TERM}.`;

export const FOUNDER_HERO_SUBHEAD =
  "You're early. Help shape the platform operators will run on for the next decade. Lock in half-price Essential or Professional monthly billing on your base subscription — one pool included per account, with additional active pools at $29/mo each.";

export const FOUNDER_ENCOURAGEMENT_LINE =
  "Municipal pools, hotels, schools, HOAs, and therapy centers — if you run water, you belong here.";

export type FounderPerk = {
  icon: SvgIconComponent;
  title: string;
  body: string;
};

export const FOUNDER_PERKS: FounderPerk[] = [
  {
    icon: VerifiedRoundedIcon,
    title: `50% off your subscription — ${FOUNDER_DISCOUNT_TERM}`,
    body: `Founder pricing applies for ${FOUNDER_DISCOUNT_TERM} on Essential or Professional monthly billing. Pool add-ons stay at standard rates.`,
  },
  {
    icon: RocketLaunchRoundedIcon,
    title: "Concierge onboarding",
    body: "Direct line to our founding team to migrate logs, SOPs, and staff workflows into Aquatics Empowered.",
  },
  {
    icon: AutoAwesomeRoundedIcon,
    title: "Shape the roadmap",
    body: "Founders influence chemical logging, maintenance, and reporting built for your facility type.",
  },
  {
    icon: EventAvailableRoundedIcon,
    title: "White-glove rollout",
    body: "Training, support, and early access to new modules before they ship to the public.",
  },
];

export const FOUNDER_TRUST_FAQ = [
  {
    q: "Who qualifies?",
    a: "Facility operators — city pools, hotels, schools, HOAs, therapy centers, and more. One founder account per qualifying organization.",
  },
  {
    q: "What does 50% off cover?",
    a: `Your Essential or Professional base subscription only, at 50% off ${FOUNDER_DISCOUNT_TERM}. Additional active pools bill at $29/mo each and are not discounted.`,
  },
  {
    q: "Can I start with a demo?",
    a: "Yes. Request a walkthrough on the last step — no commitment until you're ready to lock in founder pricing.",
  },
] as const;
