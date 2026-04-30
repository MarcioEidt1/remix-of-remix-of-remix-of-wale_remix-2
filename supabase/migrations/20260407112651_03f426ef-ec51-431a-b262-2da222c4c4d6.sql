
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  designation text NOT NULL DEFAULT '',
  quote text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage testimonials" ON public.testimonials
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active testimonials" ON public.testimonials
  FOR SELECT TO public
  USING (is_active = true);
