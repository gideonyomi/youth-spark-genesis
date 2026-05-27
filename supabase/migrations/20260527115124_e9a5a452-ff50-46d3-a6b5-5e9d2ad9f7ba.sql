
-- 1. Unique emails on newsletter, auto-collect from other forms
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_unique ON public.newsletter_subscribers (lower(email));

CREATE OR REPLACE FUNCTION public.collect_newsletter_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
    INSERT INTO public.newsletter_subscribers (email)
    VALUES (lower(trim(NEW.email)))
    ON CONFLICT (lower(email)) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS collect_email_event_reg ON public.event_registrations;
CREATE TRIGGER collect_email_event_reg AFTER INSERT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.collect_newsletter_email();

DROP TRIGGER IF EXISTS collect_email_contact ON public.contact_messages;
CREATE TRIGGER collect_email_contact AFTER INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.collect_newsletter_email();

DROP TRIGGER IF EXISTS collect_email_testimony ON public.testimony_submissions;
CREATE TRIGGER collect_email_testimony AFTER INSERT ON public.testimony_submissions
  FOR EACH ROW EXECUTE FUNCTION public.collect_newsletter_email();

DROP TRIGGER IF EXISTS collect_email_prayer ON public.prayer_requests;
CREATE TRIGGER collect_email_prayer AFTER INSERT ON public.prayer_requests
  FOR EACH ROW EXECUTE FUNCTION public.collect_newsletter_email();

-- 2. Auto-reset registration counter when all rows for an event are deleted
CREATE OR REPLACE FUNCTION public.reset_registration_counter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE remaining int;
BEGIN
  SELECT count(*) INTO remaining FROM public.event_registrations WHERE event = OLD.event;
  IF remaining = 0 THEN
    DELETE FROM public.registration_counters WHERE event = upper(OLD.event);
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS reset_counter_after_delete ON public.event_registrations;
CREATE TRIGGER reset_counter_after_delete AFTER DELETE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.reset_registration_counter();

-- 3. Pending signups (editor approval workflow)
CREATE TABLE IF NOT EXISTS public.pending_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected | suspended
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_signups TO authenticated;
GRANT ALL ON public.pending_signups TO service_role;
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create own pending signup" ON public.pending_signups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own pending signup" ON public.pending_signups
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage pending signups" ON public.pending_signups
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. Webhook logs
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  event_type text,
  status text NOT NULL, -- ok | invalid_signature | invalid_payload | error | not_found
  message text,
  signature_valid boolean,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.webhook_logs TO authenticated;
GRANT ALL ON public.webhook_logs TO service_role;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read webhook logs" ON public.webhook_logs
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
