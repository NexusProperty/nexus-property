-- Complete CSRF Protection Fix
-- This script completely rebuilds CSRF protection with strict enforcement

-- Create temp table to report results
DROP TABLE IF EXISTS temp_csrf_report;
CREATE TEMP TABLE temp_csrf_report (
  message TEXT,
  time TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION _report(msg TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO temp_csrf_report (message) VALUES (msg);
  RAISE NOTICE '%', msg;
END;
$$ LANGUAGE plpgsql;

-- Start reporting
SELECT _report('Starting CSRF protection fix');

-- Enable RLS on both tables
SELECT _report('Enabling Row Level Security on tables...');
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Install pgcrypto extension
SELECT _report('Installing pgcrypto extension...');
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop all existing RLS policies
DO $$
DECLARE
  policy_record RECORD;
  policies_dropped INTEGER := 0;
BEGIN
  -- Drop all policies on properties table
  FOR policy_record IN 
    SELECT policyname
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'properties'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || policy_record.policyname || ' ON public.properties';
    policies_dropped := policies_dropped + 1;
  END LOOP;
  
  -- Drop all policies on profiles table
  FOR policy_record IN 
    SELECT policyname
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || policy_record.policyname || ' ON public.profiles';
    policies_dropped := policies_dropped + 1;
  END LOOP;
  
  PERFORM _report('Dropped ' || policies_dropped || ' existing RLS policies');
END $$;

-- CSRF safety function - strict verification
CREATE OR REPLACE FUNCTION public.is_csrf_safe()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token TEXT;
  method TEXT;
  csrf_debug JSONB;
BEGIN
  -- Get the request method
  method := current_setting('request.method', true);
  
  -- Start building debug info
  csrf_debug := jsonb_build_object(
    'timestamp', now(),
    'method', method
  );
  
  -- Read-only methods are safe from CSRF
  IF method IN ('GET', 'HEAD', 'OPTIONS') THEN
    RAISE LOG 'CSRF safe: % is a read-only method', method;
    RETURN TRUE;
  END IF;
  
  -- For mutation methods, strictly enforce CSRF token
  IF method IN ('POST', 'PUT', 'DELETE', 'PATCH') THEN
    BEGIN
      -- Get token from header
      token := current_setting('request.headers.x-csrf-token', true);
      csrf_debug := csrf_debug || jsonb_build_object('header_token', COALESCE(token, 'NULL'));
      
      -- STRICT: Token must exist and not be empty
      IF token IS NULL OR token = '' THEN
        RAISE LOG 'CSRF rejected: No token in header. Debug: %', csrf_debug;
        RETURN FALSE;
      END IF;
      
      -- Get session token
      DECLARE
        session_token TEXT;
      BEGIN
        -- Get token from session
        session_token := current_setting('request.jwt.claim.csrf_token', true);
        csrf_debug := csrf_debug || jsonb_build_object('session_token', COALESCE(session_token, 'NULL'));
        
        -- STRICT: Session token must exist and not be empty
        IF session_token IS NULL OR session_token = '' THEN
          RAISE LOG 'CSRF rejected: No token in session. Debug: %', csrf_debug;
          RETURN FALSE;
        END IF;
        
        -- STRICT: Tokens must match exactly
        IF token = session_token THEN
          RAISE LOG 'CSRF accepted: Token matched. Debug: %', csrf_debug;
          RETURN TRUE;
        ELSE
          RAISE LOG 'CSRF rejected: Token mismatch. Debug: %', csrf_debug;
          RETURN FALSE;
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          csrf_debug := csrf_debug || jsonb_build_object('session_error', SQLERRM);
          RAISE LOG 'CSRF rejected: Session error. Debug: %', csrf_debug;
          RETURN FALSE;
      END;
    EXCEPTION
      WHEN OTHERS THEN
        csrf_debug := csrf_debug || jsonb_build_object('error', SQLERRM);
        RAISE LOG 'CSRF rejected: General error. Debug: %', csrf_debug;
        RETURN FALSE;
    END;
  END IF;
  
  -- Default to false for any other case
  RAISE LOG 'CSRF rejected: Unknown method %. Debug: %', method, csrf_debug;
  RETURN FALSE;
END;
$$;

-- CSRF token generator with secure approach
CREATE OR REPLACE FUNCTION public.get_csrf_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token TEXT;
  current_token TEXT;
  debug_info JSONB;
BEGIN
  debug_info := jsonb_build_object('timestamp', now());
  
  -- Check for existing token
  BEGIN
    current_token := current_setting('request.jwt.claim.csrf_token', true);
    debug_info := debug_info || jsonb_build_object('existing_token', COALESCE(current_token, 'NULL'));
    
    -- Return existing token if valid
    IF current_token IS NOT NULL AND current_token != '' THEN
      RAISE LOG 'CSRF token returned existing: %', debug_info;
      RETURN current_token;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      debug_info := debug_info || jsonb_build_object('error', SQLERRM);
  END;
  
  -- Generate cryptographically secure token
  -- Using multiple sources of randomness
  token := encode(digest(gen_random_uuid()::text || clock_timestamp()::text, 'sha256'), 'hex');
  debug_info := debug_info || jsonb_build_object('new_token', token);
  
  -- Store token in session (persistently)
  BEGIN
    PERFORM set_config('request.jwt.claim.csrf_token', token, false);
    RAISE LOG 'CSRF token generated new: %', debug_info;
  EXCEPTION
    WHEN OTHERS THEN
      debug_info := debug_info || jsonb_build_object('set_error', SQLERRM);
      RAISE LOG 'CSRF token store error: %', debug_info;
  END;
  
  RETURN token;
END;
$$;

-- Create request context debugging function
CREATE OR REPLACE FUNCTION public.debug_request_context()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  headers JSONB := '{}'::jsonb;
  jwt_claims JSONB := '{}'::jsonb;
BEGIN
  -- Try to get all headers
  BEGIN
    headers := jsonb_build_object(
      'X-CSRF-Token', COALESCE(current_setting('request.headers.x-csrf-token', true), 'MISSING'),
      'Content-Type', COALESCE(current_setting('request.headers.content-type', true), 'MISSING'),
      'User-Agent', COALESCE(current_setting('request.headers.user-agent', true), 'MISSING')
    );
  EXCEPTION WHEN OTHERS THEN
    headers := jsonb_build_object('error', SQLERRM);
  END;
  
  -- Try to get all JWT claims
  BEGIN
    jwt_claims := jsonb_build_object(
      'role', COALESCE(current_setting('request.jwt.claim.role', true), 'MISSING'),
      'user_id', COALESCE(current_setting('request.jwt.claim.sub', true), 'MISSING'),
      'csrf_token', COALESCE(current_setting('request.jwt.claim.csrf_token', true), 'MISSING')
    );
  EXCEPTION WHEN OTHERS THEN
    jwt_claims := jsonb_build_object('error', SQLERRM);
  END;
  
  -- Build full result
  result := jsonb_build_object(
    'request_method', COALESCE(current_setting('request.method', true), 'MISSING'),
    'auth_role', COALESCE(current_setting('role', true), 'MISSING'),
    'auth_uid', COALESCE(auth.uid()::text, 'MISSING'),
    'headers', headers,
    'jwt_claims', jwt_claims,
    'timestamp', NOW()
  );
  
  -- Log the full context
  RAISE LOG 'Request context: %', result;
  
  RETURN result;
END;
$$;

SELECT _report('Created CSRF security functions');

-- Create properties table policies with strict CSRF checking
SELECT _report('Creating properties table policies...');

-- 1. A specific policy for SELECT operations (no CSRF needed for reading)
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
    (public.is_csrf_safe() IS TRUE)
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
    (public.is_csrf_safe() IS TRUE)
  );

-- 4. A specific policy for DELETE operations (requires CSRF)
CREATE POLICY delete_own_properties ON public.properties
  FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() AND
    (public.is_csrf_safe() IS TRUE)
  );

-- Create profiles table policies with strict CSRF checking  
SELECT _report('Creating profiles table policies...');

-- 1. A policy for SELECT operations (no CSRF needed for reading)
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
    (public.is_csrf_safe() IS TRUE)
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
    (public.is_csrf_safe() IS TRUE)
  );

-- 4. A policy for DELETE operations (requires CSRF)
CREATE POLICY allow_delete_own_profile ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    id = auth.uid() AND
    (public.is_csrf_safe() IS TRUE)
  );

-- Grant execute permissions
SELECT _report('Granting function permissions...');
GRANT EXECUTE ON FUNCTION public.is_csrf_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_csrf_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_request_context() TO authenticated;

-- Analyze the table structure to update stats
ANALYZE public.properties;
ANALYZE public.profiles;

-- Verify policies were created
DO $$
DECLARE
  prop_policies INTEGER := 0;
  profile_policies INTEGER := 0;
  policy_record RECORD;
BEGIN
  -- Count properties policies
  SELECT COUNT(*) INTO prop_policies 
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'properties';
  
  -- Count profiles policies
  SELECT COUNT(*) INTO profile_policies 
  FROM pg_policies 
  WHERE schemaname = 'public' AND tablename = 'profiles';
  
  PERFORM _report('Created ' || prop_policies || ' policies for properties table');
  PERFORM _report('Created ' || profile_policies || ' policies for profiles table');
  
  -- List all policies in detail
  PERFORM _report('=== PROPERTIES POLICIES ===');
  FOR policy_record IN 
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'properties'
    ORDER BY policyname
  LOOP
    PERFORM _report(policy_record.policyname || 
                ' (' || policy_record.cmd || ')' ||
                ' USING: ' || COALESCE(policy_record.qual, 'none') ||
                ' WITH CHECK: ' || COALESCE(policy_record.with_check, 'none'));
  END LOOP;
  
  PERFORM _report('=== PROFILES POLICIES ===');
  FOR policy_record IN 
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'profiles'
    ORDER BY policyname
  LOOP
    PERFORM _report(policy_record.policyname || 
                ' (' || policy_record.cmd || ')' ||
                ' USING: ' || COALESCE(policy_record.qual, 'none') ||
                ' WITH CHECK: ' || COALESCE(policy_record.with_check, 'none'));
  END LOOP;
END $$;

SELECT _report('CSRF protection fix complete!');
SELECT _report('Please run the verification script to confirm the fix worked');

-- Show the report
SELECT * FROM temp_csrf_report ORDER BY time; 