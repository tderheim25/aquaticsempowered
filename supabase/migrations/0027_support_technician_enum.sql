-- Step 1 of 2: add enum value (must run in its own migration / commit before 0028).
-- PostgreSQL does not allow using a new enum value in the same transaction as ADD VALUE.
-- Run this file first, then run 0028_support_portal.sql.

alter type public.user_role add value if not exists 'support_technician';
