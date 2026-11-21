CREATE OR REPLACE FUNCTION public.validate_registration_code(_event text, _code text)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_reg record;
  v_form record;
BEGIN
  IF _code IS NULL OR length(trim(_code)) = 0 OR length(_code) > 50 OR _event IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'missing_input');
  END IF;

  SELECT full_name, event, registration_code, payment_status INTO v_reg
  FROM public.event_registrations
  WHERE upper(registration_code) = upper(trim(_code)) AND upper(event) = upper(trim(_event))
  LIMIT 1;

  IF v_reg.registration_code IS NULL OR v_reg.payment_status IS DISTINCT FROM 'paid' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  SELECT id, title, description, sections INTO v_form
  FROM public.evaluation_forms
  WHERE upper(event) = upper(trim(_event)) AND is_active = true
  ORDER BY updated_at DESC LIMIT 1;

  IF v_form.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'no_active_form');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'registration', jsonb_build_object('full_name', split_part(v_reg.full_name, ' ', 1), 'event', v_reg.event, 'registration_code', v_reg.registration_code),
    'form', jsonb_build_object('id', v_form.id, 'title', v_form.title, 'description', v_form.description, 'sections', v_form.sections)
  );
END $function$;

CREATE OR REPLACE FUNCTION public.submit_evaluation(_event text, _code text, _form_id uuid, _answers jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_reg record;
  v_form record;
BEGIN
  IF _code IS NULL OR length(_code) > 50 OR pg_column_size(_answers) > 100000 THEN
    RAISE EXCEPTION 'Invalid submission';
  END IF;
  SELECT id, event, registration_code, payment_status INTO v_reg
  FROM public.event_registrations
  WHERE upper(registration_code) = upper(trim(_code)) AND upper(event) = upper(trim(_event))
  LIMIT 1;
  IF v_reg.id IS NULL OR v_reg.payment_status IS DISTINCT FROM 'paid' THEN
    RAISE EXCEPTION 'Invalid or unpaid Registration ID';
  END IF;

  SELECT id, event, is_active INTO v_form FROM public.evaluation_forms WHERE id = _form_id LIMIT 1;
  IF v_form.id IS NULL OR NOT v_form.is_active OR upper(v_form.event) <> upper(trim(_event)) THEN
    RAISE EXCEPTION 'Evaluation form is not available';
  END IF;

  INSERT INTO public.evaluation_submissions (form_id, registration_id, registration_code, event, answers)
  VALUES (_form_id, v_reg.id, v_reg.registration_code, v_reg.event, COALESCE(_answers, '{}'::jsonb))
  ON CONFLICT (form_id, registration_code) DO UPDATE SET answers = EXCLUDED.answers, submitted_at = now();

  RETURN jsonb_build_object('ok', true);
END $function$;

-- Photos stay viewable by direct link (public bucket); only staff can list/browse them
DROP POLICY IF EXISTS "Public read registration photos" ON storage.objects;
CREATE POLICY "Staff read registration photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'registration-photos' AND (public.can_edit(auth.uid()) OR public.has_role(auth.uid(), 'support')));