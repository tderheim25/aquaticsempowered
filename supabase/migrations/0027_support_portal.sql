-- DEPRECATED: split into two migrations (PostgreSQL enum commit requirement).
-- 1) Run 0027_support_technician_enum.sql  (add enum value — commit)
-- 2) Run 0028_support_portal.sql           (tables, RLS, seeds)

-- If you already ran this file partially, the enum may exist; skip step 1 and run step 2 only.
