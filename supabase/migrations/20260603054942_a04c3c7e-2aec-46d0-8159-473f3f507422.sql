DROP POLICY IF EXISTS "Editors manage badge templates" ON public.badge_templates;
CREATE POLICY "Admins manage badge templates"
ON public.badge_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));