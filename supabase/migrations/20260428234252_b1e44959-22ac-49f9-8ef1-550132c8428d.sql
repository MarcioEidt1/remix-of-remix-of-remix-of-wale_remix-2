ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS is_promotion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promotion_price numeric,
  ADD COLUMN IF NOT EXISTS promotion_label text DEFAULT 'OFERTA',
  ADD COLUMN IF NOT EXISTS promotion_until date;