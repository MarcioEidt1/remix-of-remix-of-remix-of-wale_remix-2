
ALTER TABLE public.user_roles 
  ADD COLUMN is_master boolean NOT NULL DEFAULT false,
  ADD COLUMN permissions text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
      AND role = 'admin'
      AND (is_master = true OR _permission = ANY(permissions))
  )
$$;
