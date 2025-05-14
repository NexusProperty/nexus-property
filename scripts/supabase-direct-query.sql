-- Create a function to execute arbitrary SQL
-- WARNING: This function is extremely dangerous and should only be used for development
-- Remove after applying the CSRF fix

-- Function to execute arbitrary SQL (requires service role)
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
  RETURN 'SQL executed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Grant execute to authenticated users (for development only)
-- REVOKE this permission after applying the fix!
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;

-- Test the function
SELECT exec_sql('SELECT 1 as test');

-- Create a safer alternative function for executing pre-defined queries
CREATE OR REPLACE FUNCTION apply_csrf_fixes()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Enable RLS on both properties and profiles tables
  ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing CSRF policies
  DROP POLICY IF EXISTS csrf_protection_properties ON public.properties;
  
  -- Install pgcrypto if not already installed
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  
  -- Create function to check if a request is CSRF safe
  CREATE OR REPLACE FUNCTION public.is_csrf_safe()
  RETURNS BOOLEAN
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $func$
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
  $func$;
  
  -- Create a function to get a CSRF token for the current session
  CREATE OR REPLACE FUNCTION public.get_csrf_token()
  RETURNS TEXT
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $func$
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
  $func$;
  
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
  
  -- Create policies for profiles table
  DROP POLICY IF EXISTS allow_read_own_profile ON public.profiles;
  DROP POLICY IF EXISTS allow_insert_own_profile ON public.profiles;
  DROP POLICY IF EXISTS allow_update_own_profile ON public.profiles;
  
  CREATE POLICY allow_read_own_profile ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());
  
  CREATE POLICY allow_insert_own_profile ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
      id = auth.uid() AND public.is_csrf_safe()
    );
  
  CREATE POLICY allow_update_own_profile ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
      id = auth.uid() AND public.is_csrf_safe()
    );
  
  -- Grant execute permissions
  GRANT EXECUTE ON FUNCTION public.is_csrf_safe() TO authenticated;
  GRANT EXECUTE ON FUNCTION public.get_csrf_token() TO authenticated;
  
  RETURN 'CSRF protection has been fixed successfully';
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION apply_csrf_fixes() TO authenticated; 