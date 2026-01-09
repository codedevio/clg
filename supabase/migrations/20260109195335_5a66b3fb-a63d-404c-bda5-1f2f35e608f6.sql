-- Step 1: Clean up duplicate roles - delete 'creator' and 'admin' roles for users who have 'super_admin'
DELETE FROM public.user_roles 
WHERE role IN ('creator', 'admin') 
AND user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'super_admin');

-- Step 2: Convert remaining 'creator' roles to 'super_admin' 
-- (only if they don't already have super_admin)
UPDATE public.user_roles SET role = 'super_admin' 
WHERE role = 'creator' 
AND user_id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'super_admin');

-- Step 3: Delete all remaining 'creator' role entries (should be none after above)
DELETE FROM public.user_roles WHERE role = 'creator';

-- Step 4: Create a function to ensure only one super_admin exists
CREATE OR REPLACE FUNCTION public.enforce_single_superadmin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'super_admin' THEN
    IF EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE role = 'super_admin' 
      AND user_id != NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Only one Creator/Superadmin can exist in the system';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 5: Create trigger to enforce single superadmin
DROP TRIGGER IF EXISTS enforce_single_superadmin_trigger ON public.user_roles;
CREATE TRIGGER enforce_single_superadmin_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_superadmin();

-- Step 6: Create function to check if user can assign roles
CREATE OR REPLACE FUNCTION public.can_assign_role(_assigner_id uuid, _target_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.has_role(_assigner_id, 'super_admin') AND _target_role IN ('admin', 'student') THEN true
    WHEN public.has_role(_assigner_id, 'admin') AND _target_role = 'student' THEN true
    ELSE false
  END
$$;

-- Step 7: Create function to get role hierarchy level
CREATE OR REPLACE FUNCTION public.get_role_level(_role app_role)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _role
    WHEN 'super_admin' THEN 3
    WHEN 'admin' THEN 2
    WHEN 'student' THEN 1
    ELSE 0
  END
$$;

-- Step 8: Update has_role function to handle hierarchy
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role 
        OR (role = 'super_admin' AND _role IN ('admin', 'creator'))
      )
  )
$$;

-- Step 9: Update handle_new_user to assign 'student' role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

-- Step 10: Update RLS policies for user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admin can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can assign student roles" ON public.user_roles;

CREATE POLICY "Super admin can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage student roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin') AND role = 'student')
WITH CHECK (public.has_role(auth.uid(), 'admin') AND role = 'student');