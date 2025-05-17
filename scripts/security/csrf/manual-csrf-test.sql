-- Manual Test Script for CSRF Protection Implementation
-- This script creates a simplified environment to test the CSRF token generation and verification functionality

-- Enable the pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a minimal auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create a users table in the auth schema
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a function to simulate auth.uid()
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE SQL
AS $$
  SELECT '00000000-0000-0000-0000-000000000001'::UUID;
$$;

-- Create the CSRF tokens table
CREATE TABLE IF NOT EXISTS public.csrf_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '24 hours',
  is_used BOOLEAN DEFAULT FALSE,
  UNIQUE(token)
);

-- Create a test user
INSERT INTO auth.users (id, email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com')
ON CONFLICT (id) DO NOTHING;

-- Create a function to generate CSRF tokens
CREATE OR REPLACE FUNCTION public.generate_csrf_token()
RETURNS TEXT
LANGUAGE plpgsql
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
CREATE OR REPLACE FUNCTION public.validate_csrf_token(input_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  valid BOOLEAN;
BEGIN
  -- Check if the token exists, belongs to the current user, and is not expired
  UPDATE csrf_tokens
  SET is_used = TRUE
  WHERE csrf_tokens.token = input_token
    AND user_id = auth.uid()
    AND expires_at > now()
    AND is_used = FALSE
  RETURNING TRUE INTO valid;
  
  -- Return false if no matching token was found
  RETURN COALESCE(valid, FALSE);
END;
$$;

-- Create a function to simulate the request.method setting
CREATE OR REPLACE FUNCTION set_request_method(method TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.method', method, true);
  RAISE NOTICE 'Request method set to: %', method;
END;
$$;

-- Create a function to simulate the request.headers setting
CREATE OR REPLACE FUNCTION set_request_headers(token TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.headers', json_build_object('x-csrf-token', token)::text, true);
  RAISE NOTICE 'Request headers set with token: %', token;
END;
$$;

-- Create a function to check if a request is a safe method
CREATE OR REPLACE FUNCTION public.is_safe_method()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  method TEXT;
  result BOOLEAN;
BEGIN
  -- Check if the request method is safe
  method := current_setting('request.method', true);
  result := method IN ('GET', 'HEAD', 'OPTIONS');
  RAISE NOTICE 'is_safe_method check: method=%, result=%', method, result;
  RETURN result;
END;
$$;

-- Create a function to check if a request has a valid CSRF token
CREATE OR REPLACE FUNCTION public.has_valid_csrf_token()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  token TEXT;
  headers TEXT;
  headers_json JSON;
  result BOOLEAN;
BEGIN
  -- Get the CSRF token from the request headers
  BEGIN
    headers := current_setting('request.headers', true);
    RAISE NOTICE 'Headers content: %', headers;
    headers_json := headers::json;
    token := headers_json->>'x-csrf-token';
    RAISE NOTICE 'Extracted token: %', token;
    
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error extracting token from headers: %', SQLERRM;
      token := NULL;
  END;
  
  -- If no token is provided, return false
  IF token IS NULL THEN
    RAISE NOTICE 'No token found in headers';
    RETURN FALSE;
  END IF;
  
  -- Validate the token
  result := public.validate_csrf_token(token);
  RAISE NOTICE 'has_valid_csrf_token check: token=%, result=%', token, result;
  RETURN result;
END;
$$;

-- Create a function to check if a request is CSRF safe
CREATE OR REPLACE FUNCTION public.is_csrf_safe()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  is_safe BOOLEAN;
  has_token BOOLEAN;
  result BOOLEAN;
BEGIN
  -- If the request is a safe method, it's CSRF safe
  is_safe := public.is_safe_method();
  IF is_safe THEN
    RAISE NOTICE 'Request is CSRF safe because it uses a safe method';
    RETURN TRUE;
  END IF;
  
  -- If the request has a valid CSRF token, it's CSRF safe
  has_token := public.has_valid_csrf_token();
  result := has_token;
  
  IF result THEN
    RAISE NOTICE 'Request is CSRF safe because it has a valid token';
  ELSE
    RAISE NOTICE 'Request is not CSRF safe: uses unsafe method and has no valid token';
  END IF;
  
  RETURN result;
END;
$$;

-- Run the tests
DO $$
DECLARE
  test_token TEXT;
  verification_result BOOLEAN;
BEGIN
  RAISE NOTICE '======= CSRF Protection Testing =======';
  
  -- Step 1: Test token generation
  RAISE NOTICE 'Step 1: Testing token generation...';
  
  test_token := public.generate_csrf_token();
  IF test_token IS NOT NULL THEN
    RAISE NOTICE 'Success: Generated token: %', test_token;
  ELSE
    RAISE NOTICE 'Error: Failed to generate token';
    RETURN;
  END IF;
  
  -- Step 2: Test token validation (should pass)
  RAISE NOTICE 'Step 2: Testing token validation with valid token...';
  
  SELECT public.validate_csrf_token(test_token) INTO verification_result;
  IF verification_result = TRUE THEN
    RAISE NOTICE 'Success: Token verified correctly';
  ELSE
    RAISE NOTICE 'Error: Token verification failed for a valid token';
  END IF;
  
  -- Step 3: Test token reuse (should fail as tokens are one-time use)
  RAISE NOTICE 'Step 3: Testing token reuse (should fail)...';
  
  SELECT public.validate_csrf_token(test_token) INTO verification_result;
  IF verification_result = FALSE THEN
    RAISE NOTICE 'Success: Token reuse was correctly prevented';
  ELSE
    RAISE NOTICE 'Error: Token reuse was incorrectly allowed';
  END IF;
  
  -- Step 4: Test with invalid token (should fail)
  RAISE NOTICE 'Step 4: Testing with invalid token (should fail)...';
  
  SELECT public.validate_csrf_token('invalid_token_' || gen_random_uuid()) INTO verification_result;
  IF verification_result = FALSE THEN
    RAISE NOTICE 'Success: Invalid token was correctly rejected';
  ELSE
    RAISE NOTICE 'Error: Invalid token was incorrectly accepted';
  END IF;
  
  -- Step 5: Test the is_csrf_safe function directly
  RAISE NOTICE 'Step 5: Testing is_csrf_safe function...';
  
  -- Generate a new token for testing
  test_token := public.generate_csrf_token();
  RAISE NOTICE 'Generated new token for remaining tests: %', test_token;
  
  -- Simulate a GET request (should be safe)
  RAISE NOTICE '5.1: Testing GET request (should be safe)...';
  PERFORM set_request_method('GET');
  SELECT public.is_csrf_safe() INTO verification_result;
  IF verification_result = TRUE THEN
    RAISE NOTICE 'Success: GET request correctly identified as safe';
  ELSE
    RAISE NOTICE 'Error: GET request incorrectly identified as unsafe';
  END IF;
  
  -- Simulate a POST request with token in header
  RAISE NOTICE '5.2: Testing POST request with valid token (should be safe)...';
  PERFORM set_request_method('POST');
  PERFORM set_request_headers(test_token);
  SELECT public.is_csrf_safe() INTO verification_result;
  IF verification_result = TRUE THEN
    RAISE NOTICE 'Success: POST request with valid token in header correctly identified as safe';
  ELSE
    RAISE NOTICE 'Error: POST request with valid token in header incorrectly identified as unsafe';
  END IF;
  
  -- Simulate a POST request without token (should fail)
  RAISE NOTICE '5.3: Testing POST request without token (should be unsafe)...';
  PERFORM set_request_method('POST');
  PERFORM set_config('request.headers', '{}', true);
  PERFORM set_config('request.parameters', '{}', true);
  PERFORM set_config('request.json', '{}', true);
  SELECT public.is_csrf_safe() INTO verification_result;
  IF verification_result = FALSE THEN
    RAISE NOTICE 'Success: POST request without token correctly identified as unsafe';
  ELSE
    RAISE NOTICE 'Error: POST request without token incorrectly identified as safe';
  END IF;
  
  RAISE NOTICE '======= CSRF Protection Testing Complete =======';
END;
$$;

-- Clean up test data (uncomment to clean up after testing)
-- DROP FUNCTION IF EXISTS public.generate_csrf_token();
-- DROP FUNCTION IF EXISTS public.validate_csrf_token(TEXT);
-- DROP FUNCTION IF EXISTS public.is_safe_method();
-- DROP FUNCTION IF EXISTS public.has_valid_csrf_token();
-- DROP FUNCTION IF EXISTS public.is_csrf_safe();
-- DROP FUNCTION IF EXISTS set_request_method(TEXT);
-- DROP FUNCTION IF EXISTS set_request_headers(TEXT);
-- DROP FUNCTION IF EXISTS auth.uid();
-- DROP TABLE IF EXISTS public.csrf_tokens;
-- DROP TABLE IF EXISTS auth.users;
-- DROP SCHEMA IF EXISTS auth; 