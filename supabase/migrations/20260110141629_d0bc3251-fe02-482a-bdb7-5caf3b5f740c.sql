-- Create a secure function to transfer super_admin ownership
-- This function handles the atomic transfer of ownership
CREATE OR REPLACE FUNCTION public.transfer_superadmin_ownership(_new_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_owner_id uuid;
BEGIN
  -- Get the current super_admin
  SELECT user_id INTO _current_owner_id
  FROM public.user_roles
  WHERE role = 'super_admin'
  LIMIT 1;
  
  -- Verify caller is the current super_admin
  IF _current_owner_id IS NULL OR _current_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the current Creator can transfer ownership';
  END IF;
  
  -- Verify new owner exists in profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _new_owner_id) THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;
  
  -- Prevent transferring to self
  IF _new_owner_id = _current_owner_id THEN
    RAISE EXCEPTION 'Cannot transfer ownership to yourself';
  END IF;
  
  -- Temporarily disable the trigger to allow the transfer
  ALTER TABLE public.user_roles DISABLE TRIGGER enforce_single_superadmin_trigger;
  
  -- Remove super_admin from current owner
  DELETE FROM public.user_roles 
  WHERE user_id = _current_owner_id AND role = 'super_admin';
  
  -- Add admin role to former super_admin (they become an admin)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_current_owner_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Remove existing roles from new owner (clean slate)
  DELETE FROM public.user_roles WHERE user_id = _new_owner_id;
  
  -- Add super_admin role to new owner
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_new_owner_id, 'super_admin');
  
  -- Re-enable the trigger
  ALTER TABLE public.user_roles ENABLE TRIGGER enforce_single_superadmin_trigger;
  
  RETURN true;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Re-enable trigger on error
    ALTER TABLE public.user_roles ENABLE TRIGGER enforce_single_superadmin_trigger;
    RAISE;
END;
$$;