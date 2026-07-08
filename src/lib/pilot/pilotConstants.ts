/** Default complimentary pilot access end (September 30, 2026 UTC). */
export const DEFAULT_PILOT_ACCESS_UNTIL = "2026-09-30T23:59:59.000Z";

/** Default pool add-on licenses for pilot orgs (beyond first included pool). */
export const DEFAULT_PILOT_POOL_LICENSE_QUANTITY = 5;

export const PILOT_PLAN_CODE = "enterprise" as const;

/** Downloadable CSV template for AE Console pilot import. */
export const PILOT_IMPORT_CSV_TEMPLATE = `org_name,org_tier,facility_name,user_email,user_full_name,user_role,is_owner
Sunrise Aquatics,municipal,Sunrise Aquatics,jane@facility.com,Jane Smith,org_admin,yes
Sunrise Aquatics,municipal,Sunrise Aquatics,mike@facility.com,Mike Jones,manager,no`;
