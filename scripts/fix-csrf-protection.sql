-- Script to fix CSRF protection implementation
-- Run this in the Supabase SQL editor

-- Enable RLS on both properties and profiles tables
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  -- Check properties table
  SELECT relrowsecurity INTO rls_enabled 
  FROM pg_class 
  WHERE relnamespace = 'public'::regnamespace AND relname = 'properties';
  
  IF NOT COALESCE(rls_enabled, FALSE) THEN
    RAISE NOTICE 'Enabling RLS on properties table...';
    EXECUTE 'ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY';
  ELSE
    RAISE NOTICE 'RLS is already enabled on properties table';
  END IF;
  
  -- Check profiles table
  SELECT relrowsecurity INTO rls_enabled 
  FROM pg_class 
  WHERE relnamespace = 'public'::regnamespace AND relname = 'profiles';
  
  IF NOT COALESCE(rls_enabled, FALSE) THEN
    RAISE NOTICE 'Enabling RLS on profiles table...';
    EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';
  ELSE
    RAISE NOTICE 'RLS is already enabled on profiles table';
  END IF;
END $$;

-- Drop existing CSRF policies on the properties table
DO $$
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS csrf_protection_properties ON public.properties';
  RAISE NOTICE 'Dropped existing CSRF protection policy on properties table';
END $$;

-- Create a function to check if a request is CSRF safe
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
  
  -- If the request is a safe method, it's CSRF safe
  IF method IN ('GET', 'HEAD', 'OPTIONS') THEN
    RETURN TRUE;
  END IF;
  
  -- If the request is a mutation, check if it has a valid CSRF token
  IF method IN ('POST', 'PUT', 'DELETE', 'PATCH') THEN
    -- Get the CSRF token from the request headers
    BEGIN
      token := current_setting('request.headers.x-csrf-token', true);
      
      -- If no token is provided, return false
      IF token IS NULL OR token = '' THEN
        RAISE LOG 'CSRF protection: No token provided';
        RETURN FALSE;
      END IF;
      
      -- Get the session token
      DECLARE
        session_token TEXT;
      BEGIN
        session_token := current_setting('request.jwt.claim.csrf_token', true);
        
        -- If no session token, return false
        IF session_token IS NULL OR session_token = '' THEN
          RAISE LOG 'CSRF protection: No session token found';
          RETURN FALSE;
        END IF;
        
        -- Check if the token matches
        IF token = session_token THEN
          RETURN TRUE;
        ELSE
          RAISE LOG 'CSRF protection: Token mismatch. Provided: %, Expected: %', token, session_token;
          RETURN FALSE;
        END IF;
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

-- Create a function to get a CSRF token for the current session
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
  -- Check if there's already a token in the session
  BEGIN
    current_token := current_setting('request.jwt.claim.csrf_token', true);
    
    -- If there's already a token, return it
    IF current_token IS NOT NULL AND current_token != '' THEN
      RETURN current_token;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If there's an error getting the current token, generate a new one
      NULL;
  END;
  
  -- Generate a secure random token
  token := md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text);
  
  -- Store the token in the session with is_local = false to make it persistent
  PERFORM set_config('request.jwt.claim.csrf_token', token, false);
  
  RETURN token;
END;
$$;

-- Install pgcrypto if not already installed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the CSRF protection policy for properties table
CREATE POLICY csrf_protection_properties ON public.properties
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = owner_id OR public.is_csrf_safe()
  )
  WITH CHECK (
    auth.uid() = owner_id AND public.is_csrf_safe()
  );

-- Create profile policies
DO $$
BEGIN
  -- Drop any existing profile policies
  EXECUTE 'DROP POLICY IF EXISTS allow_read_own_profile ON public.profiles';
  EXECUTE 'DROP POLICY IF EXISTS allow_insert_own_profile ON public.profiles';
  EXECUTE 'DROP POLICY IF EXISTS allow_update_own_profile ON public.profiles';
  
  -- Create policies for profiles table
  EXECUTE '
    CREATE POLICY allow_read_own_profile ON public.profiles
      FOR SELECT
      TO authenticated
      USING (id = auth.uid())
  ';
  
  EXECUTE '
    CREATE POLICY allow_insert_own_profile ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (
        id = auth.uid() AND public.is_csrf_safe()
      )
  ';
  
  EXECUTE '
    CREATE POLICY allow_update_own_profile ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (id = auth.uid())
      WITH CHECK (
        id = auth.uid() AND public.is_csrf_safe()
      )
  ';
  
  RAISE NOTICE 'Created policies for profiles table';
END $$;

-- List all policies on the properties table
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE 'Policies on the properties table:';
  FOR policy_record IN 
    SELECT policyname, permissive, cmd, qual, with_check
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'properties'
    ORDER BY policyname
  LOOP
    RAISE NOTICE 'Policy: %, Permissive: %, Command: %, Using: %, With Check: %', 
      policy_record.policyname, 
      policy_record.permissive,
      policy_record.cmd,
      policy_record.qual,
      policy_record.with_check;
  END LOOP;
END $$;

-- List all policies on the profiles table
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE 'Policies on the profiles table:';
  FOR policy_record IN 
    SELECT policyname, permissive, cmd, qual, with_check
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
    ORDER BY policyname
  LOOP
    RAISE NOTICE 'Policy: %, Permissive: %, Command: %, Using: %, With Check: %', 
      policy_record.policyname, 
      policy_record.permissive,
      policy_record.cmd,
      policy_record.qual,
      policy_record.with_check;
  END LOOP;
END $$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_csrf_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_csrf_token() TO authenticated;

-- Output a message to indicate that the script has completed
SELECT 'CSRF protection has been fixed. Please run the verification script again.' AS message; 