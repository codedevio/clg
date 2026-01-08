-- Create site_settings table for admin-configurable settings
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Create footer_links table for dynamic footer content
CREATE TABLE public.footer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL, -- 'platform', 'support', 'social'
  label text NOT NULL,
  url text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create footer_content table for footer branding
CREATE TABLE public.footer_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL DEFAULT 'QuizoraX',
  brand_description text NOT NULL DEFAULT 'A secure, backend-first quiz and survey platform built for academic assessments.',
  copyright_text text NOT NULL DEFAULT 'All rights reserved.',
  tagline text NOT NULL DEFAULT 'Built for Academic Excellence',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_content ENABLE ROW LEVEL SECURITY;

-- Policies for site_settings (super_admin only for write, public read)
CREATE POLICY "Anyone can read site settings"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage site settings"
ON public.site_settings FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Policies for footer_links
CREATE POLICY "Anyone can read footer links"
ON public.footer_links FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage footer links"
ON public.footer_links FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Policies for footer_content
CREATE POLICY "Anyone can read footer content"
ON public.footer_content FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage footer content"
ON public.footer_content FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Insert default footer content
INSERT INTO public.footer_content (brand_name, brand_description, copyright_text, tagline)
VALUES ('QuizoraX', 'A secure, backend-first quiz and survey platform built for academic assessments with exam-grade integrity.', 'All rights reserved.', 'Built for Academic Excellence');

-- Insert default footer links
INSERT INTO public.footer_links (section, label, url, order_index) VALUES
('platform', 'Features', '#features', 1),
('platform', 'How It Works', '#how-it-works', 2),
('platform', 'Security', '#security', 3),
('platform', 'Documentation', '#', 4),
('support', 'Help Center', '#', 1),
('support', 'Contact Us', '#', 2),
('support', 'Privacy Policy', '#', 3),
('support', 'Terms of Service', '#', 4);

-- Insert default site settings
INSERT INTO public.site_settings (key, value, description) VALUES
('notifications_enabled', 'true', 'Enable email notifications globally'),
('allow_password_change', 'true', 'Allow users to change their passwords'),
('allow_account_deletion', 'true', 'Allow users to delete their accounts');