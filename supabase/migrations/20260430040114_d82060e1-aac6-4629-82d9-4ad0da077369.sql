-- 1) Drop duplicate storage policies on vehicle-images bucket
DROP POLICY IF EXISTS "Admins can delete vehicle images storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update vehicle images storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload vehicle images storage" ON storage.objects;

-- 2) Revoke public/anon access to user-resolution RPCs to prevent enumeration.
--    The login and forgot-password flows now go through the `resolve-login`
--    edge function which adds rate limiting and uses the service role internally.
REVOKE EXECUTE ON FUNCTION public.resolve_login_email(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.resolve_recovery_email(text) FROM anon, authenticated, public;
