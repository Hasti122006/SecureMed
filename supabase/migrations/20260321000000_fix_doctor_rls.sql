-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS "Doctors can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Doctors can view all profiles" ON public.profiles;

-- Allow doctors to see patient roles (so they can find patients)
CREATE POLICY "Doctors can view patient roles" 
ON public.user_roles 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'doctor') 
  AND (role = 'patient' OR auth.uid() = user_id)
);

-- Allow patients to view other patients would break privacy, so only doctors see all patient data
-- Patients can only see their own data (existing policy handles this)

-- Allow doctors to see all profiles (so they can see patient names)
CREATE POLICY "Doctors can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'doctor'));

-- Allow patients to view their own profile (already exists but being explicit)
-- Allow doctors to view patient profiles they are working with
CREATE POLICY "Doctors can view patient profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.medical_records 
    WHERE doctor_id = auth.uid() 
    AND patient_id = profiles.user_id
  )
);
