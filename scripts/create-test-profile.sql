-- Script to create a profile for the test user
-- Run this in the Supabase SQL editor

-- First, get the user ID from the auth.users table
-- Replace 'your-test-email@example.com' with your actual test user email
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = 'your-test-email@example.com';
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please check the email address.';
  END IF;
  
  -- Temporarily disable RLS for the profiles table
  ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
  
  -- Insert the profile
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (user_id, 'jackchen1996@outlook.co.nz', 'Test User', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  -- Re-enable RLS
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE 'Profile created successfully for user ID: %', user_id;
END $$; 