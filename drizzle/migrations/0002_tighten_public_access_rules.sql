CREATE TABLE IF NOT EXISTS public.private_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  paystack_secret_key text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.private_settings TO authenticated;
GRANT ALL ON public.private_settings TO service_role;
ALTER TABLE public.private_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage private settings" ON public.private_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.private_settings (id, paystack_secret_key)
SELECT 1, data->>'paystack_secret_key' FROM public.site_settings WHERE id = 1 AND coalesce(data->>'paystack_secret_key','') <> ''
ON CONFLICT (id) DO UPDATE SET paystack_secret_key = EXCLUDED.paystack_secret_key;
UPDATE public.site_settings SET data = data - 'paystack_secret_key' WHERE data ? 'paystack_secret_key';

CREATE OR REPLACE FUNCTION public.tg_strip_site_secret()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.data ? 'paystack_secret_key' THEN
    IF public.has_role(auth.uid(), 'admin') OR auth.role() = 'service_role' THEN
      INSERT INTO public.private_settings (id, paystack_secret_key, updated_at)
      VALUES (1, NULLIF(NEW.data->>'paystack_secret_key',''), now())
      ON CONFLICT (id) DO UPDATE SET paystack_secret_key = EXCLUDED.paystack_secret_key, updated_at = now();
    END IF;
    NEW.data := NEW.data - 'paystack_secret_key';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_strip_site_secret ON public.site_settings;
CREATE TRIGGER trg_strip_site_secret BEFORE INSERT OR UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_strip_site_secret();

DROP POLICY IF EXISTS "Public read settings" ON public.site_settings;
CREATE POLICY "Public read settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (id = 1);

DROP POLICY IF EXISTS "Public read go" ON public.general_overseer;
CREATE POLICY "Public read go" ON public.general_overseer FOR SELECT TO anon, authenticated USING (id IS NOT NULL);

DROP POLICY IF EXISTS "Public read badge templates" ON public.badge_templates;
CREATE POLICY "Public read badge templates" ON public.badge_templates FOR SELECT TO anon, authenticated
  USING (active = true OR public.can_edit(auth.uid()));

DROP POLICY IF EXISTS "Anyone register" ON public.event_registrations;

DROP POLICY IF EXISTS "Anyone submit testimony" ON public.testimony_submissions;
CREATE POLICY "Anyone submit testimony" ON public.testimony_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (published = false AND length(btrim(name)) BETWEEN 1 AND 200 AND length(btrim(story)) BETWEEN 20 AND 10000
    AND (email IS NULL OR length(email) <= 255) AND (location IS NULL OR length(location) <= 200));

DROP POLICY IF EXISTS "Anyone can submit prayer" ON public.prayer_requests;
CREATE POLICY "Anyone can submit prayer" ON public.prayer_requests FOR INSERT TO anon, authenticated
  WITH CHECK (length(btrim(request)) BETWEEN 1 AND 5000 AND (name IS NULL OR length(name) <= 200)
    AND (email IS NULL OR length(email) <= 255));

DROP POLICY IF EXISTS "Anyone subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone subscribe" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated
  WITH CHECK (length(email) <= 255 AND email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$');

DROP POLICY IF EXISTS "Anyone contact" ON public.contact_messages;
CREATE POLICY "Anyone contact" ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (length(btrim(name)) BETWEEN 1 AND 200 AND length(email) <= 255 AND email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    AND length(btrim(message)) BETWEEN 1 AND 5000 AND (subject IS NULL OR length(subject) <= 300));

DROP POLICY IF EXISTS "Anyone upload registration photos" ON storage.objects;
CREATE POLICY "Anyone upload registration photos" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'registration-photos'
    AND (storage.foldername(name))[1] IN ('YEC','SSC','NSS')
    AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp','heic','heif'));