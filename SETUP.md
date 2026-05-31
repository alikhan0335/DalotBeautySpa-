# Dalot Beauty Spa — Supabase Setup

## 1. SQL — apne Supabase ke SQL Editor mein run karen

```sql
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;

CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- Services
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, description text, price numeric NOT NULL DEFAULT 0,
  duration text, category text, image_url text,
  is_active boolean NOT NULL DEFAULT true, sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "admins manage services" ON public.services FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- Gallery
CREATE TABLE public.gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text, image_url text NOT NULL, category text,
  sort_order int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public view gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "admins manage gallery" ON public.gallery FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- Bookings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL, phone text NOT NULL, email text,
  service text NOT NULL, booking_date date NOT NULL, booking_time text NOT NULL,
  notes text, status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone create booking" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "admins view bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update bookings" ON public.bookings FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete bookings" ON public.bookings FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, email text NOT NULL, phone text, message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone create message" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "admins view messages" ON public.messages FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update messages" ON public.messages FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete messages" ON public.messages FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- Site settings
CREATE TABLE public.site_settings (
  key text PRIMARY KEY, value text, updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public view settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "admins manage settings" ON public.site_settings FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- Storage bucket (run in SQL editor too)
INSERT INTO storage.buckets (id, name, public) VALUES ('salon-images','salon-images', true)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "public read salon-images" ON storage.objects FOR SELECT USING (bucket_id='salon-images');
CREATE POLICY "admins upload salon-images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id='salon-images' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete salon-images" ON storage.objects FOR DELETE
  USING (bucket_id='salon-images' AND public.has_role(auth.uid(),'admin'));
```

## 2. Authentication
- Supabase Dashboard → Authentication → Providers → **Email enable** karen
- Authentication → Users → **Add user** → email + password se admin user banayen
- Phir SQL Editor mein run karen (apna user_id daalen):
```sql
INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR-USER-ID-HERE','admin');
```

## 3. Site URLs
Authentication → URL Configuration → Site URL = aapki preview URL daalen.

## 4. Site access
- Public site: `/pages/home.html`
- Admin login: `/pages/login.html`
- Admin panel: `/admin/index.html`
