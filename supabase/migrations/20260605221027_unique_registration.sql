-- Partial unique index on phone to ensure non-empty phone numbers are unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique ON public.profiles(phone) WHERE phone <> '';

-- RPC function to check if email or phone already exists
CREATE OR REPLACE FUNCTION public.check_user_exists(p_email text, p_phone text)
RETURNS TABLE (email_exists boolean, phone_exists boolean)
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) AS email_exists,
    EXISTS (SELECT 1 FROM public.profiles WHERE phone = p_phone) AS phone_exists;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.check_user_exists(text, text) TO authenticated, anon;
