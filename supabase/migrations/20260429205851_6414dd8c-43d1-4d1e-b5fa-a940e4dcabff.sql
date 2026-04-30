ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS image_position text NOT NULL DEFAULT 'center';

ALTER TABLE public.vehicle_images
  ADD COLUMN IF NOT EXISTS image_position text;

COMMENT ON COLUMN public.vehicles.image_position IS 'Posição padrão do recorte 3:4 (center, top, bottom, left, right).';
COMMENT ON COLUMN public.vehicle_images.image_position IS 'Override por imagem extra (center, top, bottom, left, right). Quando NULL usa o padrão do veículo.';