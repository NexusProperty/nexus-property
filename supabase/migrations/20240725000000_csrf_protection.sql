-- CSRF Protection for Supabase
-- This migration implements CSRF protection for the Supabase API

-- Create a table to store CSRF tokens
CREATE TABLE IF NOT EXISTS public.csrf_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '24 hours',
  is_used BOOLEAN DEFAULT FALSE,
  UNIQUE(token)
);

-- Enable RLS
ALTER TABLE public.csrf_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read their own tokens" ON public.csrf_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create a function to generate CSRF tokens
CREATE OR REPLACE FUNCTION public.generate_csrf_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token TEXT;
  token_id UUID;
BEGIN
  -- Generate a random token
  token := encode(gen_random_bytes(32), 'hex');
  
  -- Store the token in the database
  INSERT INTO public.csrf_tokens (token, user_id)
  VALUES (token, auth.uid())
  RETURNING id INTO token_id;
  
  RETURN token;
END;
$$;

-- Create a function to validate CSRF tokens
CREATE OR REPLACE FUNCTION public.validate_csrf_token(token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  valid BOOLEAN;
BEGIN
  -- Check if the token exists, belongs to the current user, and is not expired
  UPDATE csrf_tokens
  SET is_used = TRUE
  WHERE token = $1
    AND user_id = auth.uid()
    AND expires_at > now()
    AND is_used = FALSE
  RETURNING TRUE INTO valid;
  
  -- Return false if no matching token was found
  RETURN COALESCE(valid, FALSE);
END;
$$;

-- Create a function to check if a request is a safe method (GET, HEAD, OPTIONS)
CREATE OR REPLACE FUNCTION public.is_safe_method()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the request method is safe
  RETURN current_setting('request.method', true) IN ('GET', 'HEAD', 'OPTIONS');
END;
$$;

-- Create a function to check if a request is a mutation (POST, PUT, DELETE, PATCH)
CREATE OR REPLACE FUNCTION public.is_mutation_method()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the request method is a mutation
  RETURN current_setting('request.method', true) IN ('POST', 'PUT', 'DELETE', 'PATCH');
END;
$$;

-- Create a function to check if a request has a valid CSRF token
CREATE OR REPLACE FUNCTION public.has_valid_csrf_token()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Get the CSRF token from the request headers
  token := current_setting('request.headers.x-csrf-token', true);
  
  -- If no token is provided, return false
  IF token IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Validate the token
  RETURN public.validate_csrf_token(token);
END;
$$;

-- Create a function to check if a request is CSRF safe
CREATE OR REPLACE FUNCTION public.is_csrf_safe()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the request is a safe method, it's CSRF safe
  IF public.is_safe_method() THEN
    RETURN TRUE;
  END IF;
  
  -- If the request is a mutation, check if it has a valid CSRF token
  IF public.is_mutation_method() THEN
    RETURN public.has_valid_csrf_token();
  END IF;
  
  -- Default to false for any other case
  RETURN FALSE;
END;
$$;

-- Create a function to apply CSRF protection to all tables
CREATE OR REPLACE FUNCTION public.apply_csrf_protection()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  table_record RECORD;
BEGIN
  -- Loop through all tables in the public schema
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  LOOP
    -- Create a CSRF protection policy for each table
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS csrf_protection_%I ON public.%I FOR ALL USING (public.is_csrf_safe())',
      table_record.table_name,
      table_record.table_name
    );
  END LOOP;
END;
$$;

-- Apply CSRF protection to all tables
-- Commented out to allow manual application as needed
-- SELECT public.apply_csrf_protection();

-- Create a function to get a CSRF token for the current session
CREATE OR REPLACE FUNCTION public.get_csrf_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generate a new CSRF token
  RETURN public.generate_csrf_token();
END;
$$;

-- Create a function to clean up expired CSRF tokens
CREATE OR REPLACE FUNCTION public.clean_expired_csrf_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.csrf_tokens
  WHERE expires_at < now()
  RETURNING count(*) INTO deleted_count;
  
  RETURN deleted_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_csrf_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_csrf_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_csrf_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_safe_method() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_mutation_method() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_valid_csrf_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_csrf_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clean_expired_csrf_tokens() TO authenticated; 