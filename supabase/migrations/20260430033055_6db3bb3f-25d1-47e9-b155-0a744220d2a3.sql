-- 1. Drop overly permissive public policy on vehicle_expenses
DROP POLICY IF EXISTS "Anyone can view vehicle expenses" ON public.vehicle_expenses;

-- 2. Restrict vehicles SELECT to admins only on base table
DROP POLICY IF EXISTS "Anyone can view active vehicles" ON public.vehicles;

CREATE POLICY "Admins can view all vehicles"
  ON public.vehicles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Create a public view exposing only safe vehicle fields
DROP VIEW IF EXISTS public.vehicles_public;

CREATE VIEW public.vehicles_public
WITH (security_invoker = false)
AS
SELECT
  id,
  brand,
  model,
  version,
  display_name,
  year,
  year_model,
  km,
  fuel,
  transmission,
  color,
  internal_color,
  doors,
  power_cv,
  price,
  image_url,
  image_position,
  highlights,
  accessories,
  description,
  video_url,
  is_active,
  status,
  is_promotion,
  promotion_price,
  promotion_label,
  promotion_until,
  featured,
  show_on_website,
  factory_warranty_date,
  created_at,
  updated_at
FROM public.vehicles
WHERE is_active = true;

-- Grant read access to anon and authenticated through the view
GRANT SELECT ON public.vehicles_public TO anon, authenticated;