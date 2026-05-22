alter table public.vendor_applications
  add column if not exists website_url text;
