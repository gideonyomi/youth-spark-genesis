
CREATE TABLE IF NOT EXISTS public.pending_registrations (
  reference TEXT PRIMARY KEY,
  event TEXT NOT NULL,
  email TEXT NOT NULL,
  amount_kobo INTEGER NOT NULL,
  data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  finalized_registration_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.pending_registrations TO service_role;

ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view pending registrations"
  ON public.pending_registrations FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER pending_registrations_set_updated_at
  BEFORE UPDATE ON public.pending_registrations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS payment_amount INTEGER,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS event_registrations_payment_reference_uidx
  ON public.event_registrations (payment_reference)
  WHERE payment_reference IS NOT NULL;
