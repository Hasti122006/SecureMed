-- Fixes: infinite recursion detected in policy for relation "user_roles"
-- Cause: policies ON user_roles that use EXISTS (SELECT ... FROM user_roles) re-enter RLS.
-- Fix: all role checks use SECURITY DEFINER public.user_has_app_role() with row_security off.

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

-- ---------- public.profiles ----------

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.user_has_app_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Doctors can view all profiles" ON public.profiles;
CREATE POLICY "Doctors can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.user_has_app_role(auth.uid(), 'doctor'::public.app_role));

DROP POLICY IF EXISTS "Doctors can view patient profiles" ON public.profiles;
CREATE POLICY "Doctors can view patient profiles" ON public.profiles
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.medical_records mr
    WHERE mr.doctor_id = auth.uid() AND mr.patient_id = profiles.user_id
  )
);

-- ---------- public.user_roles (no subquery to user_roles in policy text) ----------

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated
USING (public.user_has_app_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.user_has_app_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.user_has_app_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Doctors can view patient roles" ON public.user_roles;
CREATE POLICY "Doctors can view patient roles" ON public.user_roles
FOR SELECT TO authenticated
USING (
  public.user_has_app_role(auth.uid(), 'doctor'::public.app_role)
  AND (role = 'patient'::public.app_role OR auth.uid() = user_id)
);

-- ---------- medical_records, prescriptions, audit_logs ----------

DROP POLICY IF EXISTS "Doctors can insert records" ON public.medical_records;
CREATE POLICY "Doctors can insert records" ON public.medical_records
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = doctor_id
  AND public.user_has_app_role(auth.uid(), 'doctor'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can view all records" ON public.medical_records;
CREATE POLICY "Admins can view all records" ON public.medical_records
FOR SELECT TO authenticated
USING (public.user_has_app_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Doctors can create prescriptions" ON public.prescriptions;
CREATE POLICY "Doctors can create prescriptions" ON public.prescriptions
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = doctor_id
  AND public.user_has_app_role(auth.uid(), 'doctor'::public.app_role)
);

DROP POLICY IF EXISTS "Admins can view all prescriptions" ON public.prescriptions;
CREATE POLICY "Admins can view all prescriptions" ON public.prescriptions
FOR SELECT TO authenticated
USING (public.user_has_app_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (public.user_has_app_role(auth.uid(), 'admin'::public.app_role));

-- ---------- storage ----------

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
