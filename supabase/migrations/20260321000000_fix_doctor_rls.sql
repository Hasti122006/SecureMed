-- Allow doctors to see all user roles (so they can find patients)
CREATE POLICY "Doctors can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'doctor'));

-- Allow doctors to see all profiles (so they can see patient names)
CREATE POLICY "Doctors can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'doctor'));
