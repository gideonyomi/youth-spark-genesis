
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor','support'))
$$;

CREATE OR REPLACE FUNCTION public.can_edit(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor'))
$$;

-- Tighten content tables: editors/admins only for writes (support already gets read via existing public-read policies).
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'about_content','events','featured_testimonies','general_overseer','hero_content',
    'history_milestones','leadership','livestream_links','ministries','programs','site_settings'
  ];
  pol record;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname LIKE 'Staff write%' LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format('CREATE POLICY "Editors write %I" ON public.%I FOR ALL TO authenticated USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()))', t, t);
  END LOOP;
END $$;

-- Inbox tables: support reads, editors mutate.
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['prayer_requests','testimony_submissions','contact_messages','event_registrations'];
  pol record;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t AND (policyname LIKE 'Staff update%' OR policyname LIKE 'Staff delete%') LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format('CREATE POLICY "Editors update %I" ON public.%I FOR UPDATE TO authenticated USING (public.can_edit(auth.uid()))', t, t);
    EXECUTE format('CREATE POLICY "Editors delete %I" ON public.%I FOR DELETE TO authenticated USING (public.can_edit(auth.uid()))', t, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Staff delete subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Editors delete subscribers" ON public.newsletter_subscribers
  FOR DELETE TO authenticated USING (public.can_edit(auth.uid()));

CREATE TABLE IF NOT EXISTS public.badge_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  variant text NOT NULL DEFAULT 'primary',
  name text NOT NULL DEFAULT 'Default badge',
  background_url text,
  width integer NOT NULL DEFAULT 600,
  height integer NOT NULL DEFAULT 900,
  layout jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.badge_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.badge_templates TO authenticated;
GRANT ALL ON public.badge_templates TO service_role;

ALTER TABLE public.badge_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read badge templates" ON public.badge_templates
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Editors manage badge templates" ON public.badge_templates
  FOR ALL TO authenticated USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));

DROP TRIGGER IF EXISTS trg_badge_templates_updated_at ON public.badge_templates;
CREATE TRIGGER trg_badge_templates_updated_at
  BEFORE UPDATE ON public.badge_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
