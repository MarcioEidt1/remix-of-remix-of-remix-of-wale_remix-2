
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  recovery_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_lower_idx
  ON public.user_profiles (lower(username))
  WHERE username IS NOT NULL;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own profile"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all profiles"
  ON public.user_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.resolve_login_email(_login text)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result_email text;
  trimmed text := lower(trim(_login));
BEGIN
  IF trimmed IS NULL OR trimmed = '' THEN RETURN NULL; END IF;

  IF position('@' in trimmed) > 0 THEN
    SELECT u.email INTO result_email FROM auth.users u
    WHERE lower(u.email) = trimmed LIMIT 1;
    IF result_email IS NOT NULL THEN RETURN result_email; END IF;

    SELECT u.email INTO result_email FROM auth.users u
    JOIN public.user_profiles p ON p.user_id = u.id
    WHERE lower(p.recovery_email) = trimmed LIMIT 1;
    RETURN result_email;
  END IF;

  SELECT u.email INTO result_email FROM auth.users u
  JOIN public.user_profiles p ON p.user_id = u.id
  WHERE lower(p.username) = trimmed LIMIT 1;
  RETURN result_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_email(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.resolve_recovery_email(_login text)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result_email text;
  trimmed text := lower(trim(_login));
BEGIN
  IF trimmed IS NULL OR trimmed = '' THEN RETURN NULL; END IF;

  SELECT p.recovery_email INTO result_email
  FROM public.user_profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE lower(p.username) = trimmed
     OR lower(u.email) = trimmed
     OR lower(p.recovery_email) = trimmed
  LIMIT 1;

  IF result_email IS NOT NULL AND result_email <> '' THEN
    RETURN result_email;
  END IF;

  SELECT u.email INTO result_email
  FROM auth.users u
  LEFT JOIN public.user_profiles p ON p.user_id = u.id
  WHERE lower(u.email) = trimmed OR lower(p.username) = trimmed
  LIMIT 1;

  IF result_email IS NULL OR result_email LIKE '%@prospect.system' THEN
    RETURN NULL;
  END IF;
  RETURN result_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_recovery_email(text) TO anon, authenticated;
