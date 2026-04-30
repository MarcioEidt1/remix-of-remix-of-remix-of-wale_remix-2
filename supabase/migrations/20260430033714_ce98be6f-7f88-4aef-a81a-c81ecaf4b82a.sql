-- Restrict public SELECT on storage.objects so anon cannot list bucket contents.
-- Direct file access by URL still works (served by storage edge), but listing via
-- the storage API requires being an admin.

-- vehicle-images bucket
DROP POLICY IF EXISTS "Anyone can view vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view vehicle images storage" ON storage.objects;

CREATE POLICY "Admins can list vehicle images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'vehicle-images' AND has_role(auth.uid(), 'admin'::app_role));

-- banner-images bucket
DROP POLICY IF EXISTS "Anyone can view banner images" ON storage.objects;

CREATE POLICY "Admins can list banner images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'banner-images' AND has_role(auth.uid(), 'admin'::app_role));