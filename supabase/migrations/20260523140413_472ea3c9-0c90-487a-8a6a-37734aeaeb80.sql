
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor'))
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============ INBOX TABLES ============
CREATE TABLE public.prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  request TEXT NOT NULL,
  anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit prayer" ON public.prayer_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff read prayer" ON public.prayer_requests FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update prayer" ON public.prayer_requests FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete prayer" ON public.prayer_requests FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.testimony_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  email TEXT,
  story TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.testimony_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submit testimony" ON public.testimony_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff read testimony" ON public.testimony_submissions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update testimony" ON public.testimony_submissions FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete testimony" ON public.testimony_submissions FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  event TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone register" ON public.event_registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff read registrations" ON public.event_registrations FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update registrations" ON public.event_registrations FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete registrations" ON public.event_registrations FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff read subscribers" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete subscribers" ON public.newsletter_subscribers FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone contact" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff read contact" ON public.contact_messages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update contact" ON public.contact_messages FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff delete contact" ON public.contact_messages FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- ============ CONTENT TABLES ============
-- Singletons: site_settings, hero, about, general_overseer
CREATE TABLE public.site_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff write settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.hero_content (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  eyebrow TEXT, headline TEXT, subhead TEXT,
  cta_primary_label TEXT, cta_primary_link TEXT,
  cta_secondary_label TEXT, cta_secondary_link TEXT,
  image_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read hero" ON public.hero_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff write hero" ON public.hero_content FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER hero_updated BEFORE UPDATE ON public.hero_content FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.about_content (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  eyebrow TEXT, headline TEXT, body TEXT, watchword TEXT, scripture TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read about" ON public.about_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff write about" ON public.about_content FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER about_updated BEFORE UPDATE ON public.about_content FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.general_overseer (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT, title TEXT, bio TEXT, photo_url TEXT, quote TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.general_overseer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read go" ON public.general_overseer FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff write go" ON public.general_overseer FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER go_updated BEFORE UPDATE ON public.general_overseer FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Collections
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT, image_url TEXT, icon TEXT,
  sort_order INT NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read programs" ON public.programs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff write programs" ON public.programs FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER programs_updated BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT, icon TEXT,
  sort_order INT NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ministries" ON public.ministries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff write ministries" ON public.ministries FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER ministries_updated BEFORE UPDATE ON public.ministries FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL, title TEXT NOT NULL, badge TEXT,
  date TEXT, location TEXT, description TEXT, image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0, published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read events" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff write events" ON public.events FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.history_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year TEXT NOT NULL, theme TEXT NOT NULL, description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.history_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read history" ON public.history_milestones FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff write history" ON public.history_milestones FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER history_updated BEFORE UPDATE ON public.history_milestones FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.leadership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL, name TEXT NOT NULL, role TEXT,
  photo_url TEXT, bio TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leadership ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read leadership" ON public.leadership FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff write leadership" ON public.leadership FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER leadership_updated BEFORE UPDATE ON public.leadership FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.livestream_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL, handle TEXT, url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.livestream_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read livestream" ON public.livestream_links FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff write livestream" ON public.livestream_links FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER livestream_updated BEFORE UPDATE ON public.livestream_links FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.featured_testimonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, location TEXT, quote TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.featured_testimonies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read featured testimonies" ON public.featured_testimonies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff write featured testimonies" ON public.featured_testimonies FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER featured_test_updated BEFORE UPDATE ON public.featured_testimonies FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('site-images', 'site-images', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public read site-images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'site-images');
CREATE POLICY "Staff upload site-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-images' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff update site-images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-images' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete site-images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-images' AND public.is_staff(auth.uid()));

-- ============ SEED DATA ============
INSERT INTO public.site_settings (id, data) VALUES (1, jsonb_build_object(
  'siteName', 'BLHMYOUTH',
  'tagline', 'Rooted in Holiness, Empowered for Purpose',
  'themeVerse', 'Hebrews 12:14',
  'email', 'info@blhmyec.org',
  'instagram', '@blhmyec',
  'facebook', 'blhmyec',
  'youtube', '@blhmyec'
));

INSERT INTO public.hero_content (id, eyebrow, headline, subhead, cta_primary_label, cta_primary_link, cta_secondary_label, cta_secondary_link)
VALUES (1, 'BLHMYOUTH', 'Rooted in Holiness, Empowered for Purpose',
'The youth arm of Bible Life Holiness Ministry — pursuing holiness, walking in purpose, anchored in Hebrews 12:14.',
'Join Us', '#join', 'Our Events', '#events');

INSERT INTO public.about_content (id, eyebrow, headline, body, watchword, scripture)
VALUES (1, 'About BLHMYOUTH',
'A generation pursuing holiness, walking in purpose',
'The Bible Life Holiness Ministry Youth Department (BLHMYOUTH) is the youth arm of Bible Life Holiness Ministry. We are a community of young people committed to the pursuit of holiness and empowerment for purpose.',
'Holiness is our watchword. Empowerment for purpose is our goal.',
'Hebrews 12:14 — "Follow peace with all men, and holiness, without which no man shall see the Lord."');

INSERT INTO public.general_overseer (id, name, title, quote)
VALUES (1, 'General Overseer', 'Bible Life Holiness Ministry',
'A steady, fatherly voice calling this generation to the highway of holiness.');

INSERT INTO public.programs (title, description, sort_order) VALUES
('Bible Study & Discipleship', 'Weekly studies that ground young believers in the Word and the pursuit of holiness.', 1),
('Leadership Development', 'Equipping young leaders to serve with integrity, vision and purpose.', 2),
('Worship & Encounter', 'Spirit-led gatherings to encounter God and grow in intimacy with Him.', 3);

INSERT INTO public.ministries (title, description, icon, sort_order) VALUES
('State Programmes', 'Local state-level fellowships and outreaches.', 'MapPin', 1),
('SOM & Rescue Mission', 'School of Ministry training and rescue mission outreach.', 'HeartHandshake', 2),
('Missions', 'Reaching the unreached with the gospel of holiness.', 'Globe', 3),
('Teenagers'' Program', 'Discipling teens in holiness and purpose.', 'Users', 4),
('Campus Corners', 'On-campus fellowships across universities.', 'BookOpen', 5),
('Youth Camp Ground', 'A dedicated space for retreats and encounters.', 'Tent', 6);

INSERT INTO public.events (tag, title, badge, date, location, description, sort_order) VALUES
('YEC', 'Youth Empowerment Conference', '🎉 30th Anniversary Edition', 'August 15–18, 2026', 'Main Auditorium, BLHM HQ', '2026 marks 30 years of YEC! Four transformative days of worship, holiness teaching, and empowerment.', 1),
('SSC', 'Student Success Camp', NULL, 'December 20–23, 2026', 'Camp Ground Retreat Center', 'A 4-day camp blending academic mentorship with spiritual growth, rooted in the pursuit of holiness.', 2),
('NSS', 'National Singles'' Summit', NULL, 'October 10–12, 2026', 'BLHM Conference Center', 'A powerful gathering for single believers — rooted in holiness, focused on purpose.', 3);

INSERT INTO public.history_milestones (year, theme, sort_order) VALUES
('1994', 'Fire Conference', 1),
('2000', 'Holiness Generation', 2),
('2010', 'Purpose Awakening', 3),
('2020', 'Resilient Faith', 4),
('2026', 'Emergence — 30th Anniversary', 5);

INSERT INTO public.leadership (group_name, name, role, sort_order) VALUES
('Council Chairman', 'To be announced', 'Council Chairman', 1),
('National Executives', 'To be announced', 'National Youth President', 2),
('National Executives', 'To be announced', 'National Secretary', 3),
('National Executives', 'To be announced', 'National Coordinator', 4),
('State Coordinators', 'To be announced', 'Lagos State', 5),
('State Coordinators', 'To be announced', 'Oyo State', 6),
('State Coordinators', 'To be announced', 'FCT Abuja', 7),
('State Coordinators', 'To be announced', 'Rivers State', 8);

INSERT INTO public.livestream_links (platform, handle, url, sort_order) VALUES
('YouTube', '@blhmyec', 'https://youtube.com/@blhmyec', 1),
('Facebook', 'blhmyec', 'https://facebook.com/blhmyec', 2),
('Instagram', '@blhmyec', 'https://instagram.com/blhmyec', 3);

INSERT INTO public.featured_testimonies (name, location, quote, sort_order) VALUES
('Esther', 'Lagos', 'YEC reshaped my walk with God. I came in restless and left rooted.', 1),
('Daniel', 'Abuja', 'The teaching on holiness changed how I lead at work and at home.', 2),
('Grace', 'Port Harcourt', 'I found a family that calls me higher. Purpose feels reachable now.', 3);

-- Auto-promote the first user who signs up to admin (one-time helper)
CREATE OR REPLACE FUNCTION public.handle_first_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created_first_admin
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_first_admin();
