
CREATE TABLE public.blogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  images TEXT[] DEFAULT '{}',
  links TEXT[] DEFAULT '{}',
  category TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blogs_published ON public.blogs(is_published, published_at DESC);
CREATE INDEX idx_blogs_slug ON public.blogs(slug);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public view published blogs" ON public.blogs
  FOR SELECT USING (is_published = true);

CREATE POLICY "admins view all blogs" ON public.blogs
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage blogs" ON public.blogs
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON public.blogs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
