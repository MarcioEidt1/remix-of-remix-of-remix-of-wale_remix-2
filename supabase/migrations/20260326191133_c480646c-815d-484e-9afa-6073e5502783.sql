
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '',
  year INTEGER NOT NULL,
  km INTEGER NOT NULL DEFAULT 0,
  fuel TEXT NOT NULL DEFAULT 'Flex',
  transmission TEXT NOT NULL DEFAULT 'Automático',
  price NUMERIC NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  highlights TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active vehicles" ON public.vehicles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage vehicles" ON public.vehicles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  link TEXT DEFAULT '#veiculos',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners" ON public.banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage banners" ON public.banners
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact" ON public.contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view contacts" ON public.contacts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update contacts" ON public.contacts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle-images', 'vehicle-images', true);

CREATE POLICY "Anyone can view vehicle images" ON storage.objects
  FOR SELECT USING (bucket_id = 'vehicle-images');

CREATE POLICY "Admins can upload vehicle images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update vehicle images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vehicle images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-images' AND public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (key, value) VALUES
  ('phone', '(11) 99999-9999'),
  ('whatsapp', '5511999999999'),
  ('email', 'contato@waleautomoveis.com.br'),
  ('address', 'Av. Principal, 1000 - São Paulo, SP'),
  ('instagram', 'https://instagram.com/waleautomoveis'),
  ('facebook', 'https://facebook.com/waleautomoveis');
