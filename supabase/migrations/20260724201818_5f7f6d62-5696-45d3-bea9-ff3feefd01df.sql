
CREATE OR REPLACE FUNCTION public.save_badge_template(
  _id uuid,
  _event text,
  _variant text,
  _name text,
  _background_url text,
  _width int,
  _height int,
  _layout jsonb
) RETURNS public.badge_templates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.badge_templates;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Deactivate every currently-active row for this (event, variant) except the target row.
  UPDATE public.badge_templates
     SET active = false, updated_at = now()
   WHERE event = _event
     AND variant = _variant
     AND active = true
     AND (_id IS NULL OR id <> _id);

  IF _id IS NOT NULL AND EXISTS (SELECT 1 FROM public.badge_templates WHERE id = _id) THEN
    UPDATE public.badge_templates
       SET event = _event,
           variant = _variant,
           name = _name,
           background_url = _background_url,
           width = _width,
           height = _height,
           layout = _layout,
           active = true,
           updated_at = now()
     WHERE id = _id
     RETURNING * INTO v_row;
  ELSE
    INSERT INTO public.badge_templates (event, variant, name, background_url, width, height, layout, active)
    VALUES (_event, _variant, _name, _background_url, _width, _height, _layout, true)
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END $$;

GRANT EXECUTE ON FUNCTION public.save_badge_template(uuid, text, text, text, text, int, int, jsonb) TO authenticated;
