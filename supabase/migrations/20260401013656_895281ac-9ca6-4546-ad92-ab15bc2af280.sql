
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS display_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS crv text DEFAULT '',
  ADD COLUMN IF NOT EXISTS engine_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS power_cv text DEFAULT '',
  ADD COLUMN IF NOT EXISTS ownership_type text DEFAULT 'proprio',
  ADD COLUMN IF NOT EXISTS current_owner text DEFAULT '',
  ADD COLUMN IF NOT EXISTS dpvat_year text DEFAULT '',
  ADD COLUMN IF NOT EXISTS licensing_year text DEFAULT '';
