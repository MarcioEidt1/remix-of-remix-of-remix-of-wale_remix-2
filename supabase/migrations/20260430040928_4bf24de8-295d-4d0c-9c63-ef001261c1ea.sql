-- =========================================================
-- 1) Vehicles: restrict sensitive columns from public access
-- =========================================================

-- Drop the overly broad public SELECT policy
DROP POLICY IF EXISTS "Anyone can view active vehicles" ON public.vehicles;

-- Revoke any wildcard table-level SELECT from anon/authenticated so column grants take effect
REVOKE SELECT ON public.vehicles FROM anon, authenticated;

-- Grant SELECT only on safe, public-facing columns
GRANT SELECT (
  id, brand, model, version, display_name, year, year_model, km, fuel,
  transmission, color, internal_color, doors, power_cv, price, image_url,
  image_position, highlights, accessories, description, video_url,
  is_active, status, is_promotion, promotion_price, promotion_label,
  promotion_until, featured, show_on_website, factory_warranty_date,
  licensing_year, created_at, updated_at
) ON public.vehicles TO anon, authenticated;

-- Recreate the public-facing row filter via RLS (active vehicles only)
CREATE POLICY "Public can view active vehicles (safe columns)"
  ON public.vehicles
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- =========================================================
-- 2) user_roles: prevent non-master admins from escalating
-- =========================================================

-- Helper: is the calling user a master admin?
CREATE OR REPLACE FUNCTION public.is_master_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
      AND is_master = true
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_master_admin(uuid) FROM anon, authenticated, public;

-- Drop the overly broad management policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Keep SELECT visibility for any admin (already exists: "Admins can view all roles"),
-- but restrict write operations to master admins only.

CREATE POLICY "Master admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_master_admin(auth.uid()));

CREATE POLICY "Master admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.is_master_admin(auth.uid()))
  WITH CHECK (public.is_master_admin(auth.uid()));

CREATE POLICY "Master admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.is_master_admin(auth.uid()));