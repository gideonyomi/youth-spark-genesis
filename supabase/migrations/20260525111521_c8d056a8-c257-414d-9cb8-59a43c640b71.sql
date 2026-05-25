
-- Add fields to event_registrations
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS registration_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_reference text;

-- Sequence counter table per event
CREATE TABLE IF NOT EXISTS public.registration_counters (
  event text PRIMARY KEY,
  last_number integer NOT NULL DEFAULT 0
);
ALTER TABLE public.registration_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read counters" ON public.registration_counters
  FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- Trigger function to auto-generate registration_code
CREATE OR REPLACE FUNCTION public.assign_registration_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prefix text;
  next_num integer;
BEGIN
  IF NEW.registration_code IS NOT NULL THEN RETURN NEW; END IF;
  prefix := upper(coalesce(NEW.event, 'GEN'));
  INSERT INTO public.registration_counters (event, last_number)
    VALUES (prefix, 1)
    ON CONFLICT (event) DO UPDATE SET last_number = registration_counters.last_number + 1
    RETURNING last_number INTO next_num;
  NEW.registration_code := prefix || lpad(next_num::text, 3, '0');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_assign_registration_code ON public.event_registrations;
CREATE TRIGGER trg_assign_registration_code
  BEFORE INSERT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.assign_registration_code();

-- Public storage bucket for registration photos
INSERT INTO storage.buckets (id, name, public)
  VALUES ('registration-photos', 'registration-photos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read registration photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'registration-photos');

CREATE POLICY "Anyone upload registration photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'registration-photos');
