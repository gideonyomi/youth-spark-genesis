
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

CREATE OR REPLACE FUNCTION public.publish_scheduled_blog_posts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.blog_posts
     SET status = 'published',
         published_at = COALESCE(published_at, now()),
         scheduled_at = NULL
   WHERE status = 'scheduled'
     AND scheduled_at IS NOT NULL
     AND scheduled_at <= now();
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'publish-scheduled-blog-posts') THEN
    PERFORM cron.unschedule('publish-scheduled-blog-posts');
  END IF;
  PERFORM cron.schedule(
    'publish-scheduled-blog-posts',
    '*/5 * * * *',
    $cron$ SELECT public.publish_scheduled_blog_posts(); $cron$
  );
END $$;
