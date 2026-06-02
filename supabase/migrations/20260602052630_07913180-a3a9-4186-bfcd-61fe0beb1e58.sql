
CREATE OR REPLACE FUNCTION public.submit_event_registration(
  p_full_name text,
  p_email text,
  p_phone text,
  p_event text,
  p_age_range text,
  p_state text,
  p_zone_fellowship text,
  p_notes text,
  p_photo_url text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  IF p_full_name IS NULL OR length(trim(p_full_name)) = 0 THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  IF p_event IS NULL OR length(trim(p_event)) = 0 THEN
    RAISE EXCEPTION 'Event is required';
  END IF;

  INSERT INTO public.event_registrations (
    full_name, email, phone, event, age_range, state, zone_fellowship, notes, photo_url
  ) VALUES (
    trim(p_full_name), lower(trim(p_email)), nullif(trim(coalesce(p_phone,'')),''),
    upper(trim(p_event)), p_age_range, p_state, p_zone_fellowship,
    nullif(trim(coalesce(p_notes,'')),''), p_photo_url
  )
  RETURNING registration_code INTO v_code;

  RETURN v_code;
END $$;

REVOKE ALL ON FUNCTION public.submit_event_registration(text,text,text,text,text,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_event_registration(text,text,text,text,text,text,text,text,text) TO anon, authenticated;
