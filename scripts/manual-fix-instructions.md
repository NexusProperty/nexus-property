# Manual CSRF Protection Fix Instructions

The automated script was unable to apply the CSRF protection fixes. You'll need to manually run the SQL fix in the Supabase SQL editor.

## Steps:

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (`nexus-property`)
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the contents of the `direct-csrf-fix.sql` file into the editor
6. Execute the query
7. After execution, run the verification script to check if the fix worked:

```bash
cd scripts
npm run verify-csrf
```

## Key Problems Identified

The current CSRF protection implementation has the following issues:

1. CSRF protection isn't being enforced - requests without tokens or with invalid tokens still succeed
2. Profile creation is failing due to RLS policy issues
3. The RLS policies aren't correctly scoped to operation types (SELECT, INSERT, UPDATE, DELETE)

## Troubleshooting Steps

If you encounter issues with the verification script after running the fix:

1. Check if the profiles table exists and has RLS enabled:
```sql
SELECT relrowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relname = 'profiles';
```

2. Check if the properties table exists and has RLS enabled:
```sql
SELECT relrowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relname = 'properties';
```

3. Verify the CSRF functions have been created:
```sql
SELECT proname, prosrc FROM pg_proc WHERE proname IN ('is_csrf_safe', 'get_csrf_token');
```

4. Check the RLS policies on the properties table:
```sql
SELECT policyname, cmd, roles, qual, with_check FROM pg_policies 
WHERE tablename = 'properties' AND schemaname = 'public';
```

5. Check the RLS policies on the profiles table:
```sql
SELECT policyname, cmd, roles, qual, with_check FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';
```

## Manual Fix

If you need to manually fix issues, here's a complete SQL script with commands to run in the Supabase SQL editor:

```sql
-- Direct CSRF protection fix
-- This simplified version focuses only on the essential changes

-- Enable RLS on both tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Install pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing policies
DROP POLICY IF EXISTS csrf_protection_properties ON public.properties;
DROP POLICY IF EXISTS allow_read_own_profile ON public.profiles;
DROP POLICY IF EXISTS allow_insert_own_profile ON public.profiles;
DROP POLICY IF EXISTS allow_update_own_profile ON public.profiles;
DROP POLICY IF EXISTS read_own_properties ON public.properties;
DROP POLICY IF EXISTS create_own_properties ON public.properties;

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
    public.is_csrf_safe()
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
    public.is_csrf_safe()
  );

-- 4. A specific policy for DELETE operations (requires CSRF)
CREATE POLICY delete_own_properties ON public.properties
  FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() AND
    public.is_csrf_safe()
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
    public.is_csrf_safe()
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
    public.is_csrf_safe()
  );

-- 4. A policy for DELETE operations (requires CSRF)
CREATE POLICY allow_delete_own_profile ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    id = auth.uid() AND
    public.is_csrf_safe()
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_csrf_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_csrf_token() TO authenticated;
``` 