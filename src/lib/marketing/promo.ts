/**
 * Promo display helpers — config defaults live in sitePromo.ts.
 * Server pages load live toggle state via getSitePromoConfig() and pass to client components.
 */
export {
  applyPromoDiscount,
  DEFAULT_SITE_PROMO,
  promoAppliesToPlan,
  promoAppliesToTier,
  type SitePromoConfig,
} from "@/lib/marketing/sitePromo";

import { DEFAULT_SITE_PROMO, type SitePromoConfig } from "@/lib/marketing/sitePromo";

/** @deprecated Use SitePromoConfig + getSitePromoConfig() for live toggle state. */
export type Promo = SitePromoConfig;

/** Static defaults — prefer getSitePromoConfig() on server routes. */
export const PROMO: Promo = DEFAULT_SITE_PROMO;
