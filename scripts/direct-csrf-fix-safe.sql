-- Direct CSRF protection fix (Safe Version)
-- This version safely handles existing policies by dropping them first

-- Enable RLS on both tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Install pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Safely drop all existing policies on properties and profiles tables
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- List and drop all policies on properties table
  RAISE NOTICE 'Dropping existing policies on properties table...';
  FOR policy_record IN 
    SELECT policyname
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'properties'
  LOOP
    RAISE NOTICE 'Dropping policy: %', policy_record.policyname;
    EXECUTE 'DROP POLICY IF EXISTS ' || policy_record.policyname || ' ON public.properties';
  END LOOP;
  
  -- List and drop all policies on profiles table
  RAISE NOTICE 'Dropping existing policies on profiles table...';
  FOR policy_record IN 
    SELECT policyname
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
  LOOP
    RAISE NOTICE 'Dropping policy: %', policy_record.policyname;
    EXECUTE 'DROP POLICY IF EXISTS ' || policy_record.policyname || ' ON public.profiles';
  END LOOP;
END $$;

-- Create CSRF safe function with more strict handling
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
  
  -- If the request is a safe method (read-only), it's CSRF safe
  IF method IN ('GET', 'HEAD', 'OPTIONS') THEN
    RETURN TRUE;
  END IF;
  
  -- For mutation methods, enforce CSRF token
  IF method IN ('POST', 'PUT', 'DELETE', 'PATCH') THEN
    BEGIN
      -- Get token from header
      token := current_setting('request.headers.x-csrf-token', true);
      
      -- Strict check: token must exist and not be empty
      IF token IS NULL OR token = '' THEN
        RAISE LOG 'CSRF protection: No token provided';
        RETURN FALSE;
      END IF;
      
      -- Get session token
      DECLARE
        session_token TEXT;
      BEGIN
        -- Get token from session
        session_token := current_setting('request.jwt.claim.csrf_token', true);
        
        -- Strict check: session token must exist and not be empty
        IF session_token IS NULL OR session_token = '' THEN
          RAISE LOG 'CSRF protection: No session token found';
          RETURN FALSE;
        END IF;
        
        -- Verify exact token match
        IF token = session_token THEN
          RETURN TRUE;
        ELSE
          RAISE LOG 'CSRF protection: Token mismatch. Provided: %, Expected: %', token, session_token;
          RETURN FALSE;
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'CSRF protection session error: %', SQLERRM;
          RETURN FALSE;
      END;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'CSRF protection error: %', SQLERRM;
        RETURN FALSE;
    END;
  END IF;
  
  -- Default to false for any other case
  RETURN FALSE;
END;
$$;

-- Create token generator function
CREATE OR REPLACE FUNCTION public.get_csrf_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token TEXT;
  current_token TEXT;
BEGIN
  -- Check for existing token
  BEGIN
    current_token := current_setting('request.jwt.claim.csrf_token', true);
    
    -- Return existing token if valid
    IF current_token IS NOT NULL AND current_token != '' THEN
      RETURN current_token;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Handle error silently
      NULL;
  END;
  
  -- Generate a cryptographically secure token
  token := md5(gen_random_uuid()::text || clock_timestamp()::text);
  
  -- Store token in session
  PERFORM set_config('request.jwt.claim.csrf_token', token, false);
  
  RETURN token;
END;
$$;

-- Create properties table policies
-- 1. A specific policy for SELECT operations (no CSRF needed)
CREATE POLICY read_own_properties ON public.properties
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
  );

-- 2. A specific policy for INSERT operations (requires CSRF)
CREATE POLICY create_own_properties ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND 
    public.is_csrf_safe() = TRUE
  );

-- 3. A specific policy for UPDATE operations (requires CSRF)
CREATE POLICY update_own_properties ON public.properties
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
  )
  WITH CHECK (
    owner_id = auth.uid() AND 
    public.is_csrf_safe() = TRUE
  );

-- 4. A specific policy for DELETE operations (requires CSRF)
CREATE POLICY delete_own_properties ON public.properties
  FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() AND
    public.is_csrf_safe() = TRUE
  );

-- Create profiles table policies
-- 1. A policy for SELECT operations (no CSRF needed)
CREATE POLICY allow_read_own_profile ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
  );

-- 2. A policy for INSERT operations (requires CSRF)
CREATE POLICY allow_insert_own_profile ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid() AND 
    public.is_csrf_safe() = TRUE
  );

-- 3. A policy for UPDATE operations (requires CSRF)
CREATE POLICY allow_update_own_profile ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
  )
  WITH CHECK (
    id = auth.uid() AND 
    public.is_csrf_safe() = TRUE
  );

-- 4. A policy for DELETE operations (requires CSRF)
CREATE POLICY allow_delete_own_profile ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    id = auth.uid() AND
    public.is_csrf_safe() = TRUE
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_csrf_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_csrf_token() TO authenticated;

-- Verify policies were created and log them
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE 'Properties table policies:';
  FOR policy_record IN 
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'properties'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '- Policy: %, Command: %, Using: %, With Check: %', 
      policy_record.policyname, 
      policy_record.cmd,
      policy_record.qual,
      policy_record.with_check;
  END LOOP;
  
  RAISE NOTICE 'Profiles table policies:';
  FOR policy_record IN 
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '- Policy: %, Command: %, Using: %, With Check: %', 
      policy_record.policyname, 
      policy_record.cmd,
      policy_record.qual,
      policy_record.with_check;
  END LOOP;
END $$; 