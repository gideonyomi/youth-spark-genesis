
-- Deactivate stale duplicate badge template rows so only the most recent per (event, variant) stays active.
WITH ranked AS (
  SELECT id, event, variant, active,
         ROW_NUMBER() OVER (PARTITION BY event, variant ORDER BY updated_at DESC, created_at DESC) AS rn
  FROM public.badge_templates
)
UPDATE public.badge_templates bt
SET active = false
FROM ranked r
WHERE bt.id = r.id AND r.rn > 1 AND bt.active = true;

-- Enforce one active template per (event, variant) going forward.
CREATE UNIQUE INDEX IF NOT EXISTS badge_templates_active_unique
  ON public.badge_templates (event, variant)
  WHERE active = true;
