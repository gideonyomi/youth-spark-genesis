ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS registered_by_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registered_by uuid;

ALTER TABLE public.testimony_submissions
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;

GRANT SELECT ON public.testimony_submissions TO anon;

DROP POLICY IF EXISTS "Public read published testimonies" ON public.testimony_submissions;
CREATE POLICY "Public read published testimonies"
  ON public.testimony_submissions FOR SELECT
  TO anon, authenticated
  USING (published = true AND status IN ('approved','featured'));

CREATE OR REPLACE FUNCTION public.admin_create_registration(
  p_event text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_country text,
  p_state text,
  p_city text,
  p_gender text,
  p_marital_status text,
  p_occupation text,
  p_age_range text,
  p_class_level text,
  p_first_time_attendee boolean,
  p_zone_fellowship text,
  p_notes text,
  p_photo_url text,
  p_payment_reference text,
  p_payment_amount integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.event_registrations;
BEGIN
  IF NOT public.can_edit(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_full_name IS NULL OR length(trim(p_full_name)) = 0 THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  IF p_event IS NULL OR length(trim(p_event)) = 0 THEN
    RAISE EXCEPTION 'Event is required';
  END IF;
  IF p_payment_reference IS NULL OR length(trim(p_payment_reference)) = 0 THEN
    RAISE EXCEPTION 'Payment reference is required';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.event_registrations
    WHERE payment_reference = trim(p_payment_reference)
  ) THEN
    RAISE EXCEPTION 'That payment reference is already used by another registration';
  END IF;

  INSERT INTO public.event_registrations (
    full_name, email, phone, event, age_range, state, zone_fellowship, notes, photo_url,
    country, city, gender, marital_status, occupation, class_level, first_time_attendee,
    payment_status, payment_reference, payment_amount, paid_at, status,
    registered_by_admin, registered_by, original_event
  ) VALUES (
    trim(p_full_name),
    nullif(lower(trim(coalesce(p_email,''))),''),
    nullif(trim(coalesce(p_phone,'')),''),
    upper(trim(p_event)),
    p_age_range,
    p_state,
    p_zone_fellowship,
    nullif(trim(coalesce(p_notes,'')),''),
    p_photo_url,
    p_country, p_city, p_gender, p_marital_status, p_occupation, p_class_level, p_first_time_attendee,
    'paid', trim(p_payment_reference), p_payment_amount, now(), 'confirmed',
    true, auth.uid(), upper(trim(p_event))
  )
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'registration_code', v_row.registration_code,
    'full_name', v_row.full_name,
    'event', v_row.event,
    'photo_url', v_row.photo_url
  );
END $$;