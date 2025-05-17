-- Test Script for CSRF Protection Implementation
-- This script tests the CSRF token generation and verification functionality

-- Enable the pgcrypto extension for cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Set up test environment
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
  
  -- Step 2: Test token verification (should pass)
  RAISE NOTICE 'Step 2: Testing token verification with valid token...';
  
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
  
  -- Simulate a GET request (should be safe)
  PERFORM set_config('request.method', 'GET', true);
  SELECT public.is_csrf_safe() INTO verification_result;
  IF verification_result = TRUE THEN
    RAISE NOTICE 'Success: GET request correctly identified as safe';
  ELSE
    RAISE NOTICE 'Error: GET request incorrectly identified as unsafe';
  END IF;
  
  -- Simulate a POST request with token in header
  PERFORM set_config('request.method', 'POST', true);
  PERFORM set_config('request.headers', json_build_object('x-csrf-token', test_token)::text, true);
  SELECT public.is_csrf_safe() INTO verification_result;
  IF verification_result = TRUE THEN
    RAISE NOTICE 'Success: POST request with valid token in header correctly identified as safe';
  ELSE
    RAISE NOTICE 'Error: POST request with valid token in header incorrectly identified as unsafe';
  END IF;
  
  -- Simulate a POST request without token (should fail)
  PERFORM set_config('request.method', 'POST', true);
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

-- Clean up test data (optional)
-- DELETE FROM public.csrf_tokens WHERE created_at > NOW() - INTERVAL '5 minutes'; 