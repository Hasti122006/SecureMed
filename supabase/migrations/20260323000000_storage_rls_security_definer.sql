-- Storage + user_has_app_role: function body upgraded to plpgsql + row_security off
-- (matches 221300 / 231200). Idempotent policy recreation.

CREATE OR REPLACE FUNCTION public.user_has_app_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('row_security', 'off', true);
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.user_has_app_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_app_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_app_role(uuid, public.app_role) TO service_role;

INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-records', 'medical-records', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Doctors can upload medical files" ON storage.objects;
CREATE POLICY "Doctors can upload medical files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'medical-records'
  AND public.user_has_app_role(auth.uid(), 'doctor'::public.app_role)
);

DROP POLICY IF EXISTS "Doctors can update medical files" ON storage.objects;
CREATE POLICY "Doctors can update medical files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'medical-records'
  AND public.user_has_app_role(auth.uid(), 'doctor'::public.app_role)
)
WITH CHECK (
  bucket_id = 'medical-records'
  AND public.user_has_app_role(auth.uid(), 'doctor'::public.app_role)
);

DROP POLICY IF EXISTS "Users can view their own medical files" ON storage.objects;
CREATE POLICY "Users can view their own medical files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'medical-records'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.user_has_app_role(auth.uid(), 'doctor'::public.app_role)
    OR public.user_has_app_role(auth.uid(), 'admin'::public.app_role)
  )
);
