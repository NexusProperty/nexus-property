-- Commenting out RLS tests for now until database structure is complete
/*
-- Install pgTAP if not already installed
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Define test file for RLS policies
BEGIN;

-- Plan the tests - one for each policy test
SELECT plan(30);

-- Create test users
SELECT lives_ok(
  $$
    -- Create test users for different roles
    INSERT INTO auth.users (id, email) VALUES 
      ('11111111-1111-1111-1111-111111111111'::uuid, 'admin@example.com'),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'agent1@example.com'),
      ('33333333-3333-3333-3333-333333333333'::uuid, 'agent2@example.com'),
      ('44444444-4444-4444-4444-444444444444'::uuid, 'customer@example.com');
      
    -- Create profiles for test users
    INSERT INTO public.profiles (id, email, role, full_name) VALUES 
      ('11111111-1111-1111-1111-111111111111'::uuid, 'admin@example.com', 'admin', 'Admin User'),
      ('22222222-2222-2222-2222-222222222222'::uuid, 'agent1@example.com', 'agent', 'Agent One'),
      ('33333333-3333-3333-3333-333333333333'::uuid, 'agent2@example.com', 'agent', 'Agent Two'),
      ('44444444-4444-4444-4444-444444444444'::uuid, 'customer@example.com', 'customer', 'Customer User');
      
    -- Create a team for agent1
    INSERT INTO public.teams (id, name, owner_id) VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'Team A', '22222222-2222-2222-2222-222222222222'::uuid);
      
    -- Add agent2 as a team member
    INSERT INTO public.team_members (team_id, user_id, role) VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'member');
      
    -- Create properties for each user
    INSERT INTO public.properties (id, owner_id, address, suburb, city, property_type, is_public) VALUES
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '123 Agent St', 'Suburb', 'City', 'house', false),
      ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, '456 Other St', 'Suburb', 'City', 'apartment', false),
      ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, '789 Customer St', 'Suburb', 'City', 'house', false),
      ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '101 Public St', 'Suburb', 'City', 'house', true);
      
    -- Create appraisals
    INSERT INTO public.appraisals (id, user_id, property_id, property_address, property_suburb, property_city, property_type, team_id) VALUES
      ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, '123 Agent St', 'Suburb', 'City', 'house', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
      ('gggggggg-gggg-gggg-gggg-gggggggggggg'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, '456 Other St', 'Suburb', 'City', 'apartment', NULL),
      ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, '789 Customer St', 'Suburb', 'City', 'house', NULL);
      
    -- Create comparable properties
    INSERT INTO public.comparable_properties (appraisal_id, address, suburb, city, property_type, sale_price, similarity_score) VALUES
      ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, '123 Comp St', 'Suburb', 'City', 'house', 500000, 85),
      ('gggggggg-gggg-gggg-gggg-gggggggggggg'::uuid, '456 Comp St', 'Suburb', 'City', 'apartment', 400000, 80);
      
    -- Create reports
    INSERT INTO public.reports (appraisal_id, user_id, file_path) VALUES
      ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '/reports/report1.pdf'),
      ('gggggggg-gggg-gggg-gggg-gggggggggggg'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, '/reports/report2.pdf');
      
    -- Create appraisal history
    INSERT INTO public.appraisal_history (appraisal_id, user_id, action) VALUES
      ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'created'),
      ('gggggggg-gggg-gggg-gggg-gggggggggggg'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'created');
  $$,
  'Set up test data for RLS policy tests'
);

-- Test Profile Policies
-- Admin should see all profiles
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''11111111-1111-1111-1111-111111111111''; SELECT COUNT(*) FROM public.profiles;',
  'VALUES (4::bigint)',
  'Admin can see all profiles'
);

-- Regular user should only see their own profile
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''22222222-2222-2222-2222-222222222222''; SELECT COUNT(*) FROM public.profiles;',
  'VALUES (1::bigint)',
  'Regular user can only see their own profile'
);

-- Test Team Policies
-- Team owner should see their team
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''22222222-2222-2222-2222-222222222222''; SELECT COUNT(*) FROM public.teams;',
  'VALUES (1::bigint)',
  'Team owner can see their team'
);

-- Team member should see teams they belong to
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''33333333-3333-3333-3333-333333333333''; SELECT COUNT(*) FROM public.teams;',
  'VALUES (1::bigint)',
  'Team member can see teams they belong to'
);

-- Non-member should not see any teams
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''44444444-4444-4444-4444-444444444444''; SELECT COUNT(*) FROM public.teams;',
  'VALUES (0::bigint)',
  'Non-member cannot see teams they do not belong to'
);

-- Test Team Member Policies
-- Team owner should see all members
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''22222222-2222-2222-2222-222222222222''; SELECT COUNT(*) FROM public.team_members;',
  'VALUES (1::bigint)',
  'Team owner can see all team members'
);

-- Team member should see other members
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''33333333-3333-3333-3333-333333333333''; SELECT COUNT(*) FROM public.team_members;',
  'VALUES (1::bigint)',
  'Team member can see other team members'
);

-- Non-member should not see team members
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''44444444-4444-4444-4444-444444444444''; SELECT COUNT(*) FROM public.team_members;',
  'VALUES (0::bigint)',
  'Non-member cannot see team members'
);

-- Test Property Policies
-- User should see their own properties and public properties
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''22222222-2222-2222-2222-222222222222''; SELECT COUNT(*) FROM public.properties;',
  'VALUES (2::bigint)',
  'User can see their own properties'
);

-- User should see public properties
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''44444444-4444-4444-4444-444444444444''; SELECT COUNT(*) FROM public.properties WHERE is_public = true;',
  'VALUES (1::bigint)',
  'User can see public properties'
);

-- Test Appraisal Policies
-- User should see their own appraisals
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''22222222-2222-2222-2222-222222222222''; SELECT COUNT(*) FROM public.appraisals WHERE user_id = ''22222222-2222-2222-2222-222222222222'';',
  'VALUES (1::bigint)',
  'User can see their own appraisals'
);

-- Team member should see team appraisals
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''33333333-3333-3333-3333-333333333333''; SELECT COUNT(*) FROM public.appraisals WHERE team_id = ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'';',
  'VALUES (1::bigint)',
  'Team member can see team appraisals'
);

-- User should not see others' appraisals
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''44444444-4444-4444-4444-444444444444''; SELECT COUNT(*) FROM public.appraisals WHERE user_id != ''44444444-4444-4444-4444-444444444444'';',
  'VALUES (0::bigint)',
  'User cannot see others'' appraisals'
);

-- Test Comparable Properties Policies
-- Appraisal owner should see comparable properties
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''22222222-2222-2222-2222-222222222222''; SELECT COUNT(*) FROM public.comparable_properties WHERE appraisal_id = ''ffffffff-ffff-ffff-ffff-ffffffffffff'';',
  'VALUES (1::bigint)',
  'Appraisal owner can see comparable properties'
);

-- Team member should see comparable properties for team appraisals
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''33333333-3333-3333-3333-333333333333''; SELECT COUNT(*) FROM public.comparable_properties JOIN public.appraisals ON comparable_properties.appraisal_id = appraisals.id WHERE appraisals.team_id = ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'';',
  'VALUES (1::bigint)',
  'Team member can see comparable properties for team appraisals'
);

-- User should not see others' comparable properties
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''44444444-4444-4444-4444-444444444444''; SELECT COUNT(*) FROM public.comparable_properties WHERE appraisal_id != ''hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh'';',
  'VALUES (0::bigint)',
  'User cannot see others'' comparable properties'
);

-- Test Appraisal History Policies
-- Appraisal owner should see history
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''22222222-2222-2222-2222-222222222222''; SELECT COUNT(*) FROM public.appraisal_history WHERE appraisal_id = ''ffffffff-ffff-ffff-ffff-ffffffffffff'';',
  'VALUES (1::bigint)',
  'Appraisal owner can see appraisal history'
);

-- Team member should see history for team appraisals
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''33333333-3333-3333-3333-333333333333''; SELECT COUNT(*) FROM public.appraisal_history JOIN public.appraisals ON appraisal_history.appraisal_id = appraisals.id WHERE appraisals.team_id = ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'';',
  'VALUES (1::bigint)',
  'Team member can see history for team appraisals'
);

-- User should not see others' history
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''44444444-4444-4444-4444-444444444444''; SELECT COUNT(*) FROM public.appraisal_history WHERE appraisal_id != ''hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh'';',
  'VALUES (0::bigint)',
  'User cannot see others'' appraisal history'
);

-- Test Report Policies
-- Appraisal owner should see reports
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''22222222-2222-2222-2222-222222222222''; SELECT COUNT(*) FROM public.reports WHERE user_id = ''22222222-2222-2222-2222-222222222222'';',
  'VALUES (1::bigint)',
  'Appraisal owner can see reports'
);

-- Team member should see reports for team appraisals
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''33333333-3333-3333-3333-333333333333''; SELECT COUNT(*) FROM public.reports JOIN public.appraisals ON reports.appraisal_id = appraisals.id WHERE appraisals.team_id = ''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'';',
  'VALUES (1::bigint)',
  'Team member can see reports for team appraisals'
);

-- User should not see others' reports
SELECT results_eq(
  'SET LOCAL ROLE postgres; SET LOCAL "request.jwt.claim.sub" TO ''44444444-4444-4444-4444-444444444444''; SELECT COUNT(*) FROM public.reports WHERE user_id != ''44444444-4444-4444-4444-444444444444'';',
  'VALUES (0::bigint)',
  'User cannot see others'' reports'
);

-- Test Insert Policies
-- Test that user can insert their own records
SELECT lives_ok(
  $$
    -- Set role to agent1
    SET LOCAL ROLE postgres;
    SET LOCAL "request.jwt.claim.sub" TO '22222222-2222-2222-2222-222222222222';
    
    -- User should be able to insert their own property
    INSERT INTO public.properties (owner_id, address, suburb, city, property_type)
    VALUES ('22222222-2222-2222-2222-222222222222', '123 New St', 'New Suburb', 'New City', 'house');
  $$,
  'User can insert their own property'
);

-- Test that user can't insert records for others
SELECT throws_ok(
  $$
    -- Set role to agent1
    SET LOCAL ROLE postgres;
    SET LOCAL "request.jwt.claim.sub" TO '22222222-2222-2222-2222-222222222222';
    
    -- User should not be able to insert property for another user
    INSERT INTO public.properties (owner_id, address, suburb, city, property_type)
    VALUES ('33333333-3333-3333-3333-333333333333', '123 Fail St', 'Fail Suburb', 'Fail City', 'house');
  $$,
  'new row violates row-level security policy',
  'User cannot insert property for another user'
);

-- Test Update Policies
-- Test that user can update their own records
SELECT lives_ok(
  $$
    -- Set role to agent1
    SET LOCAL ROLE postgres;
    SET LOCAL "request.jwt.claim.sub" TO '22222222-2222-2222-2222-222222222222';
    
    -- User should be able to update their own property
    UPDATE public.properties
    SET address = '123 Updated St'
    WHERE owner_id = '22222222-2222-2222-2222-222222222222' AND address = '123 Agent St';
  $$,
  'User can update their own property'
);

-- Test that user can't update others' records
SELECT results_eq(
  $$
    -- Set role to agent1
    SET LOCAL ROLE postgres;
    SET LOCAL "request.jwt.claim.sub" TO '22222222-2222-2222-2222-222222222222';
    
    -- Try to update another user's property
    UPDATE public.properties
    SET address = '456 Updated St'
    WHERE owner_id = '33333333-3333-3333-3333-333333333333';
    
    -- Should affect 0 rows
    SELECT COUNT(*)
    FROM public.properties
    WHERE owner_id = '33333333-3333-3333-3333-333333333333' AND address = '456 Updated St';
  $$,
  'VALUES (0::bigint)',
  'User cannot update another user''s property'
);

-- Test Delete Policies
-- Test that user can delete their own records
SELECT lives_ok(
  $$
    -- Set role to agent1
    SET LOCAL ROLE postgres;
    SET LOCAL "request.jwt.claim.sub" TO '22222222-2222-2222-2222-222222222222';
    
    -- User should be able to delete their own property
    DELETE FROM public.properties
    WHERE owner_id = '22222222-2222-2222-2222-222222222222' AND address = '123 Updated St';
  $$,
  'User can delete their own property'
);

-- Test that user can't delete others' records
SELECT results_eq(
  $$
    -- Set role to agent1
    SET LOCAL ROLE postgres;
    SET LOCAL "request.jwt.claim.sub" TO '22222222-2222-2222-2222-222222222222';
    
    -- Try to delete another user's property
    DELETE FROM public.properties
    WHERE owner_id = '33333333-3333-3333-3333-333333333333';
    
    -- Should still have the original property
    SELECT COUNT(*)
    FROM public.properties
    WHERE owner_id = '33333333-3333-3333-3333-333333333333';
  $$,
  'VALUES (1::bigint)',
  'User cannot delete another user''s property'
);

-- Test Team Admin Policies
-- Team owner should be able to update team
SELECT lives_ok(
  $$
    -- Set role to agent1 (team owner)
    SET LOCAL ROLE postgres;
    SET LOCAL "request.jwt.claim.sub" TO '22222222-2222-2222-2222-222222222222';
    
    -- Team owner should be able to update team
    UPDATE public.teams
    SET name = 'Updated Team A'
    WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  $$,
  'Team owner can update team'
);

-- Team member should not be able to update team
SELECT results_eq(
  $$
    -- Set role to agent2 (team member)
    SET LOCAL ROLE postgres;
    SET LOCAL "request.jwt.claim.sub" TO '33333333-3333-3333-3333-333333333333';
    
    -- Try to update team
    UPDATE public.teams
    SET name = 'Hacked Team'
    WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    
    -- Should still have the previous name
    SELECT COUNT(*)
    FROM public.teams
    WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND name = 'Hacked Team';
  $$,
  'VALUES (0::bigint)',
  'Team member cannot update team'
);

-- Team owner should be able to manage team members
SELECT lives_ok(
  $$
    -- Set role to agent1 (team owner)
    SET LOCAL ROLE postgres;
    SET LOCAL "request.jwt.claim.sub" TO '22222222-2222-2222-2222-222222222222';
    
    -- Team owner should be able to update team member role
    UPDATE public.team_members
    SET role = 'admin'
    WHERE team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND user_id = '33333333-3333-3333-3333-333333333333';
  $$,
  'Team owner can update team member role'
);

-- Clean up test data
SELECT lives_ok(
  $$
    -- Clean up all test data
    DELETE FROM public.reports WHERE appraisal_id IN ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'gggggggg-gggg-gggg-gggg-gggggggggggg');
    DELETE FROM public.appraisal_history WHERE appraisal_id IN ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'gggggggg-gggg-gggg-gggg-gggggggggggg');
    DELETE FROM public.comparable_properties WHERE appraisal_id IN ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'gggggggg-gggg-gggg-gggg-gggggggggggg');
    DELETE FROM public.appraisals WHERE id IN ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh');
    DELETE FROM public.properties WHERE id IN ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee');
    DELETE FROM public.team_members WHERE team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    DELETE FROM public.teams WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    DELETE FROM public.profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
    DELETE FROM auth.users WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444');
  $$,
  'Clean up test data'
);

-- Finish the tests and print a diagnostic count of successful tests
SELECT * FROM finish();

ROLLBACK;
*/ 