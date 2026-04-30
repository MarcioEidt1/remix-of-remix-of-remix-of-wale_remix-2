INSERT INTO storage.buckets (id, name, public) VALUES ('banner-images', 'banner-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view banner images" ON storage.objects FOR SELECT USING (bucket_id = 'banner-images');
CREATE POLICY "Admins can upload banner images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update banner images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete banner images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view vehicle images storage" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-images');
CREATE POLICY "Admins can upload vehicle images storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update vehicle images storage" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete vehicle images storage" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'))