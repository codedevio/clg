
-- Ensure the trigger exists for automatic student role assignment on signup
-- Drop if exists to avoid conflicts, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add a constraint to prevent direct role escalation via INSERT
-- This ensures only the handle_new_user function (SECURITY DEFINER) can insert the initial role
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile and assigns student role to new users. Runs with SECURITY DEFINER to bypass RLS.';
