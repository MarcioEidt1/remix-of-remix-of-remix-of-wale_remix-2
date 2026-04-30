-- Remove the previous definer view approach
DROP VIEW IF EXISTS public.vehicles_public;

-- Re-add a public SELECT policy filtered by is_active
DROP POLICY IF EXISTS "Anyone can view active vehicles" ON public.vehicles;
CREATE POLICY "Anyone can view active vehicles"
  ON public.vehicles
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Drop the admin-only SELECT policy added earlier (admins already have ALL via "Admins can manage vehicles")
DROP POLICY IF EXISTS "Admins can view all vehicles" ON public.vehicles;

-- Revoke broad SELECT from anon/authenticated and grant only safe columns
REVOKE SELECT ON public.vehicles FROM anon, authenticated;

GRANT SELECT (
  id, brand, model, version, display_name,
  year, year_model, km, fuel, transmission,
  color, internal_color, doors, power_cv,
  price, image_url, image_position,
  highlights, accessories, description, video_url,
  is_active, status,
  is_promotion, promotion_price, promotion_label, promotion_until,
  featured, show_on_website, factory_warranty_date,
  created_at, updated_at
) ON public.vehicles TO anon, authenticated;