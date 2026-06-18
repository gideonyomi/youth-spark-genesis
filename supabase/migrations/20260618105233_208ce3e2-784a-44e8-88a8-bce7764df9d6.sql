ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS class_level text,
  ADD COLUMN IF NOT EXISTS first_time_attendee boolean,
  ADD COLUMN IF NOT EXISTS original_event text;

ALTER TABLE public.pending_registrations
  ADD COLUMN IF NOT EXISTS original_event text;