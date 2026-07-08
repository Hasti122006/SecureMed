-- Run this in Supabase SQL Editor to fix patient loading issue
-- This allows doctors to query for patients to load in the dropdown

-- Step 1: Drop conflicting policies
DROP POLICY IF EXISTS "Doctors can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Doctors can view patient roles" ON public.user_roles;

-- Step 2: Create policy allowing doctors to see patient roles
CREATE POLICY "Doctors can view patient roles" 
ON public.user_roles 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'doctor') 
  AND role = 'patient'
);

-- Step 3: Keep existing policy for users to view their own roles
-- (It should already exist, but no harm ensuring it)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles 
FOR SELECT USING (auth.uid() = user_id);

-- Step 4: Verify policies
-- SELECT policyname FROM pg_policies WHERE tablename = 'user_roles';
