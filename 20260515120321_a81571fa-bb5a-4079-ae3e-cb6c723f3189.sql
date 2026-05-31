
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration TEXT,
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "admins manage services" ON public.services FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Gallery
CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public view gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "admins manage gallery" ON public.gallery FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  service TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone create booking" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "admins view bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update bookings" ON public.bookings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete bookings" ON public.bookings FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone create message" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "admins view messages" ON public.messages FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update messages" ON public.messages FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete messages" ON public.messages FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Site settings
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public view settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "admins manage settings" ON public.site_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for gallery
INSERT INTO storage.buckets (id, name, public) VALUES ('salon-images', 'salon-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read salon images" ON storage.objects FOR SELECT USING (bucket_id = 'salon-images');
CREATE POLICY "admins upload salon images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'salon-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update salon images" ON storage.objects FOR UPDATE USING (bucket_id = 'salon-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete salon images" ON storage.objects FOR DELETE USING (bucket_id = 'salon-images' AND public.has_role(auth.uid(), 'admin'));

-- Seed
INSERT INTO public.services (name, description, price, duration, category, sort_order) VALUES
('Signature Facial', 'Glow-boosting facial with deep cleanse and hydration', 1800, '60 min', 'Facial', 1),
('Hair Spa & Treatment', 'Nourishing spa to restore shine and softness', 1500, '75 min', 'Hair', 2),
('Bridal Makeup', 'Complete bridal look with HD makeup', 8000, '120 min', 'Makeup', 3),
('Manicure & Pedicure', 'Classic mani-pedi with massage', 999, '60 min', 'Nails', 4),
('Full Body Massage', 'Relaxing aromatherapy massage', 2200, '60 min', 'Spa', 5),
('Hair Color', 'Premium ammonia-free hair color', 2500, '90 min', 'Hair', 6);

INSERT INTO public.site_settings (key, value) VALUES
('hero_title', 'Refresh Your Beauty, Reveal Your Radiance'),
('hero_subtitle', 'Premium salon & spa experiences crafted just for you'),
('about_text', 'At Dalot Beauty Spa, we blend artistry and care to bring out your natural radiance. Our certified experts use premium products in a calm, luxurious setting.'),
('phone', '+1 908-468-4268'),
('whatsapp', '19084684268'),
('email', 'hello@dalotbeauty.com'),
('address', '123 Beauty Lane, Wellness City'),
('instagram', 'https://instagram.com'),
('facebook', 'https://facebook.com');
