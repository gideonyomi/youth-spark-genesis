
-- 1) Extend event_registrations with optional demographic / international fields
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS occupation text;

-- 2) Evaluation forms
CREATE TABLE IF NOT EXISTS public.evaluation_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  title text NOT NULL,
  description text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluation_forms TO authenticated;
GRANT ALL ON public.evaluation_forms TO service_role;

ALTER TABLE public.evaluation_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view evaluation forms"
  ON public.evaluation_forms FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Editors manage evaluation forms"
  ON public.evaluation_forms FOR ALL
  TO authenticated
  USING (public.can_edit(auth.uid()))
  WITH CHECK (public.can_edit(auth.uid()));

CREATE TRIGGER trg_evaluation_forms_updated
  BEFORE UPDATE ON public.evaluation_forms
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_evaluation_forms_event ON public.evaluation_forms (upper(event));

-- 3) Evaluation submissions
CREATE TABLE IF NOT EXISTS public.evaluation_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.evaluation_forms(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES public.event_registrations(id) ON DELETE SET NULL,
  registration_code text NOT NULL,
  event text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id, registration_code)
);

GRANT SELECT, DELETE ON public.evaluation_submissions TO authenticated;
GRANT ALL ON public.evaluation_submissions TO service_role;

ALTER TABLE public.evaluation_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view evaluation submissions"
  ON public.evaluation_submissions FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Editors manage evaluation submissions"
  ON public.evaluation_submissions FOR ALL
  TO authenticated
  USING (public.can_edit(auth.uid()))
  WITH CHECK (public.can_edit(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_eval_subs_form ON public.evaluation_submissions (form_id);
CREATE INDEX IF NOT EXISTS idx_eval_subs_event ON public.evaluation_submissions (upper(event));

-- 4) Public RPCs (security definer; bypass RLS safely with explicit checks)
CREATE OR REPLACE FUNCTION public.validate_registration_code(_event text, _code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg record;
  v_form record;
BEGIN
  IF _code IS NULL OR length(trim(_code)) = 0 OR _event IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'missing_input');
  END IF;

  SELECT id, full_name, event, registration_code, payment_status
    INTO v_reg
  FROM public.event_registrations
  WHERE upper(registration_code) = upper(trim(_code))
    AND upper(event) = upper(trim(_event))
  LIMIT 1;

  IF v_reg.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;
  IF v_reg.payment_status IS DISTINCT FROM 'paid' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'unpaid');
  END IF;

  SELECT id, title, description, sections
    INTO v_form
  FROM public.evaluation_forms
  WHERE upper(event) = upper(trim(_event)) AND is_active = true
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_form.id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'no_active_form');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'registration', jsonb_build_object(
      'id', v_reg.id,
      'full_name', v_reg.full_name,
      'event', v_reg.event,
      'registration_code', v_reg.registration_code
    ),
    'form', jsonb_build_object(
      'id', v_form.id,
      'title', v_form.title,
      'description', v_form.description,
      'sections', v_form.sections
    )
  );
END $$;

GRANT EXECUTE ON FUNCTION public.validate_registration_code(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_evaluation(_event text, _code text, _form_id uuid, _answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg record;
  v_form record;
  v_sub_id uuid;
BEGIN
  SELECT id, full_name, event, registration_code, payment_status
    INTO v_reg
  FROM public.event_registrations
  WHERE upper(registration_code) = upper(trim(_code))
    AND upper(event) = upper(trim(_event))
  LIMIT 1;
  IF v_reg.id IS NULL OR v_reg.payment_status IS DISTINCT FROM 'paid' THEN
    RAISE EXCEPTION 'Invalid or unpaid Registration ID';
  END IF;

  SELECT id, event, is_active INTO v_form
  FROM public.evaluation_forms WHERE id = _form_id LIMIT 1;
  IF v_form.id IS NULL OR NOT v_form.is_active OR upper(v_form.event) <> upper(trim(_event)) THEN
    RAISE EXCEPTION 'Evaluation form is not available';
  END IF;

  INSERT INTO public.evaluation_submissions (form_id, registration_id, registration_code, event, answers)
  VALUES (_form_id, v_reg.id, v_reg.registration_code, v_reg.event, COALESCE(_answers, '{}'::jsonb))
  ON CONFLICT (form_id, registration_code) DO UPDATE
    SET answers = EXCLUDED.answers, submitted_at = now()
  RETURNING id INTO v_sub_id;

  RETURN jsonb_build_object('id', v_sub_id, 'ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.submit_evaluation(text, text, uuid, jsonb) TO anon, authenticated;
