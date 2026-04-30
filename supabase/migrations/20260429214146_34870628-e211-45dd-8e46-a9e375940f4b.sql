INSERT INTO public.site_settings (key, value) VALUES
  ('feed_xml_enabled', 'true'),
  ('feed_json_enabled', 'true'),
  ('feed_cache_seconds', '300'),
  ('feed_detail_level', 'public'),
  ('feed_site_url', '')
ON CONFLICT (key) DO NOTHING;