-- Run in Supabase SQL Editor if migration 0039 has not been applied.
-- Fixes: PGRST204 "Could not find the 'water_body_type' column of 'pools'"

DO $$ BEGIN
  CREATE TYPE water_body_type AS ENUM (
    'swimming_pool',
    'splash_pad',
    'aquatic_center',
    'therapy_pool',
    'competition_pool',
    'water_park_feature',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.pools
  ADD COLUMN IF NOT EXISTS water_body_type water_body_type;

UPDATE public.pools
SET water_body_type = 'swimming_pool'
WHERE water_body_type IS NULL;

COMMENT ON COLUMN public.pools.water_body_type IS
  'Facility body-of-water category for catalog/billing display. pool_type remains sanitizer system.';

-- Refresh PostgREST schema cache after DDL
NOTIFY pgrst, 'reload schema';
