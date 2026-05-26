ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS zone_fellowship text;