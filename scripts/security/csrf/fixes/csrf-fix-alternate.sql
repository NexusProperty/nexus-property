-- Alternative CSRF Protection Fix
-- This approach uses a separate verification table instead of relying on HTTP headers

-- Enable the pgcrypto extension for cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS read_own_properties ON public.properties;
DROP POLICY IF EXISTS create_own_properties ON public.properties;
DROP POLICY IF EXISTS update_own_properties ON public.properties;
DROP POLICY IF EXISTS delete_own_properties ON public.properties;
DROP POLICY IF EXISTS allow_read_own_profile ON public.profiles;
DROP POLICY IF EXISTS allow_insert_own_profile ON public.profiles;
DROP POLICY IF EXISTS allow_update_own_profile ON public.profiles;
DROP POLICY IF EXISTS allow_delete_own_profile ON public.profiles;

-- Enable RLS on tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a table to store CSRF tokens
CREATE TABLE IF NOT EXISTS public.csrf_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  used BOOLEAN NOT NULL DEFAULT FALSE
);

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS csrf_tokens_user_id_idx ON public.csrf_tokens(user_id);
CREATE INDEX IF NOT EXISTS csrf_tokens_token_idx ON public.csrf_tokens(token);

-- Enable RLS on the tokens table
ALTER TABLE public.csrf_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policy on csrf_tokens if it exists
DROP POLICY IF EXISTS read_own_tokens ON public.csrf_tokens;

-- Allow users to see their own tokens
CREATE POLICY read_own_tokens ON public.csrf_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to generate a token
CREATE OR REPLACE FUNCTION public.generate_csrf_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token TEXT;
  token_id UUID;
BEGIN
  -- Generate a random token using md5 instead of gen_random_bytes
  new_token := md5(random()::text || clock_timestamp()::text || auth.uid()::text);
  
  -- Store the token in the database
  INSERT INTO public.csrf_tokens (user_id, token)
  VALUES (auth.uid(), new_token)
  RETURNING id INTO token_id;
  
  -- Log token creation
  RAISE LOG 'Created CSRF token % for user %', token_id, auth.uid();
  
  RETURN new_token;
END;
$$;

-- Function to verify a token is valid
CREATE OR REPLACE FUNCTION public.verify_csrf_token(token_to_verify TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Look up the token
  SELECT * INTO token_record
  FROM public.csrf_tokens
  WHERE token = token_to_verify
    AND user_id = auth.uid()
    AND used = FALSE
    AND expires_at > NOW()
  LIMIT 1;
  
  -- If no token found, return false
  IF token_record IS NULL THEN
    RAISE LOG 'Invalid CSRF token: not found or expired';
    RETURN FALSE;
  END IF;
  
  -- Mark the token as used (one-time use for extra security)
  UPDATE public.csrf_tokens
  SET used = TRUE
  WHERE id = token_record.id;
  
  RAISE LOG 'Valid CSRF token used by user %', auth.uid();
  RETURN TRUE;
END;
$$;

-- Update the existing is_csrf_safe function to use our new token approach
CREATE OR REPLACE FUNCTION public.is_csrf_safe()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token TEXT;
  method TEXT;
BEGIN
  -- Get the request method
  method := current_setting('request.method', true);

  -- Read-only methods are safe from CSRF
  IF method IN ('GET', 'HEAD', 'OPTIONS') THEN
    RAISE LOG 'CSRF safe: % is a read-only method', method;
    RETURN TRUE;
  END IF;

  -- For mutation methods, check token in both header and parameter
  IF method IN ('POST', 'PUT', 'DELETE', 'PATCH') THEN
    BEGIN
      -- Try to get token from header first
      token := current_setting('request.headers', true)::json->>'x-csrf-token';
      
      -- If not in header, try request parameter
      IF token IS NULL THEN
        -- First, check if there's a request.parameters setting
        IF current_setting('request.parameters', true) IS NOT NULL THEN
          token := current_setting('request.parameters', true)::json->>'csrf_token';
        END IF;
      END IF;
      
      -- If still no token, check in request.json.csrf_token 
      IF token IS NULL THEN
        IF current_setting('request.json', true) IS NOT NULL THEN
          token := current_setting('request.json', true)::json->>'csrf_token';
        END IF;
      END IF;
      
      -- If token found, verify it using our new function
      IF token IS NOT NULL THEN
        RETURN public.verify_csrf_token(token);
      END IF;
      
      RAISE LOG 'CSRF check failed: No valid token found';
      RETURN FALSE;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'CSRF check error: %', SQLERRM;
        RETURN FALSE;
    END;
  END IF;

  -- Default deny for unrecognized methods
  RAISE LOG 'CSRF check failed: Unrecognized method %', method;
  RETURN FALSE;
END;
$$;

-- Recreate policies for properties table
-- Allow reading own properties
CREATE POLICY read_own_properties ON public.properties
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Allow inserting properties with valid token
CREATE POLICY create_own_properties ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND public.is_csrf_safe()
  );

-- Allow updating own properties with valid token
CREATE POLICY update_own_properties ON public.properties
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() AND public.is_csrf_safe());

-- Allow deleting own properties with valid token
CREATE POLICY delete_own_properties ON public.properties
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid() AND public.is_csrf_safe());

-- Create policies for profiles table
-- Allow reading own profile
CREATE POLICY allow_read_own_profile ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow inserting own profile
CREATE POLICY allow_insert_own_profile ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() AND public.is_csrf_safe());

-- Allow updating own profile
CREATE POLICY allow_update_own_profile ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND public.is_csrf_safe());

-- Allow deleting own profile
CREATE POLICY allow_delete_own_profile ON public.profiles
  FOR DELETE
  TO authenticated
  USING (id = auth.uid() AND public.is_csrf_safe());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_csrf_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_csrf_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_csrf_safe() TO authenticated;

-- Allow access to CSRF tokens table
GRANT SELECT, INSERT ON public.csrf_tokens TO authenticated;

-- Clean up expired tokens (maintenance function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_csrf_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.csrf_tokens
  WHERE expires_at < NOW()
  OR used = TRUE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Schedule cleanup job (this needs to be executed manually or via a cron job)
-- SELECT cron.schedule('cleanup_csrf_tokens', '0 * * * *', 'SELECT public.cleanup_expired_csrf_tokens()');

-- Return success message
DO $$
BEGIN
  RAISE NOTICE 'CSRF protection alternate implementation complete!';
END;
$$; 