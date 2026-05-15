-- Langelier Saturation Index support + optional hardness / TDS inputs
alter table public.chemical_logs
  add column if not exists calcium_hardness numeric,
  add column if not exists tds_ppm numeric,
  add column if not exists langelier_saturation_index numeric;

comment on column public.chemical_logs.calcium_hardness is 'Calcium hardness as CaCO₃ (ppm)';
comment on column public.chemical_logs.tds_ppm is 'Total dissolved solids (ppm), optional for LSI';
comment on column public.chemical_logs.langelier_saturation_index is 'Langelier Saturation Index (computed on write when inputs allow)';
