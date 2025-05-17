-- Simple test for CSRF token generation
-- This is a minimal script to test if the token generation works

-- Create a temporary function just for testing
CREATE OR REPLACE FUNCTION public.test_token_generation()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_token TEXT;
BEGIN
  -- Generate a random token using md5
  new_token := md5(random()::text || clock_timestamp()::text);
  
  -- Log token creation
  RAISE NOTICE 'Created test token: %', new_token;
  
  RETURN new_token;
END;
$$;

-- Execute the function
DO $$
DECLARE
  test_token TEXT;
BEGIN
  test_token := public.test_token_generation();
  RAISE NOTICE 'Test completed successfully with token: %', test_token;
END;
$$; 