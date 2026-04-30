
CREATE TABLE public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view vehicle images"
  ON public.vehicle_images FOR SELECT
  USING (true);

-- Admin insert/update/delete via has_role
CREATE POLICY "Admins can manage vehicle images"
  ON public.vehicle_images FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
