BEGIN;

-- Load the pgTAP extension
SELECT plan(16);

-- Create test users
SELECT lives_ok(
  $$
    INSERT INTO auth.users (id, email) VALUES 
    ('11111111-1111-1111-1111-111111111111'::uuid, 'owner@example.com'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'viewer@example.com'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'editor@example.com'),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'admin@example.com'),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'unrelated@example.com');
  $$,
  'Create test users'
);

-- Create profiles for test users
SELECT lives_ok(
  $$
    INSERT INTO public.profiles (id, email, full_name, role) VALUES 
    ('11111111-1111-1111-1111-111111111111'::uuid, 'owner@example.com', 'Property Owner', 'agent'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'viewer@example.com', 'Viewer User', 'agent'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'editor@example.com', 'Editor User', 'agent'),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'admin@example.com', 'Admin User', 'agent'),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'unrelated@example.com', 'Unrelated User', 'agent');
  $$,
  'Create profiles for test users'
);

-- Create test property
SELECT lives_ok(
  $$
    INSERT INTO public.properties (
      id, 
      owner_id, 
      address, 
      suburb, 
      city, 
      property_type
    ) VALUES (
      '99999999-9999-9999-9999-999999999999'::uuid,
      '11111111-1111-1111-1111-111111111111'::uuid,
      '123 Test Street',
      'Testville',
      'Testington',
      'house'
    );
  $$,
  'Create test property owned by owner@example.com'
);

-- Create property access entries
SELECT lives_ok(
  $$
    INSERT INTO public.property_access (
      property_id,
      user_id,
      access_level,
      granted_by
    ) VALUES
    (
      '99999999-9999-9999-9999-999999999999'::uuid,
      '22222222-2222-2222-2222-222222222222'::uuid,
      'viewer',
      '11111111-1111-1111-1111-111111111111'::uuid
    ),
    (
      '99999999-9999-9999-9999-999999999999'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid,
      'editor',
      '11111111-1111-1111-1111-111111111111'::uuid
    ),
    (
      '99999999-9999-9999-9999-999999999999'::uuid,
      '44444444-4444-4444-4444-444444444444'::uuid,
      'admin',
      '11111111-1111-1111-1111-111111111111'::uuid
    );
  $$,
  'Create property access entries'
);

-- Test: property owner can view all access entries for their property
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

SELECT results_eq(
  $$
    SELECT count(*) FROM public.property_access
    WHERE property_id = '99999999-9999-9999-9999-999999999999'::uuid;
  $$,
  $$SELECT 3::bigint$$,
  'Property owner can view all access entries for their property'
);

-- Test: viewer can see only their own access entry
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);

SELECT results_eq(
  $$
    SELECT count(*) FROM public.property_access
    WHERE property_id = '99999999-9999-9999-9999-999999999999'::uuid;
  $$,
  $$SELECT 1::bigint$$,
  'Viewer can see only their own access entry'
);

-- Test: editor can see only their own access entry
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);

SELECT results_eq(
  $$
    SELECT count(*) FROM public.property_access
    WHERE property_id = '99999999-9999-9999-9999-999999999999'::uuid;
  $$,
  $$SELECT 1::bigint$$,
  'Editor can see only their own access entry'
);

-- Test: admin can see all access entries for the property
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', false);

SELECT results_eq(
  $$
    SELECT count(*) FROM public.property_access
    WHERE property_id = '99999999-9999-9999-9999-999999999999'::uuid;
  $$,
  $$SELECT 3::bigint$$,
  'Admin can see all access entries for the property'
);

-- Test: unrelated user can't see any access entries
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', false);

SELECT results_eq(
  $$
    SELECT count(*) FROM public.property_access
    WHERE property_id = '99999999-9999-9999-9999-999999999999'::uuid;
  $$,
  $$SELECT 0::bigint$$,
  'Unrelated user cannot see any access entries'
);

-- Test: property owner can add new access entry
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

SELECT lives_ok(
  $$
    INSERT INTO public.property_access (
      property_id,
      user_id,
      access_level,
      granted_by
    ) VALUES (
      '99999999-9999-9999-9999-999999999999'::uuid,
      '55555555-5555-5555-5555-555555555555'::uuid,
      'viewer',
      '11111111-1111-1111-1111-111111111111'::uuid
    );
  $$,
  'Property owner can add new access entry'
);

-- Test: admin can add new access entry
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', false);

SELECT lives_ok(
  $$
    INSERT INTO public.property_access (
      property_id,
      user_id,
      access_level,
      granted_by
    ) VALUES (
      '99999999-9999-9999-9999-999999999999'::uuid,
      '55555555-5555-5555-5555-555555555555'::uuid,
      'editor',
      '44444444-4444-4444-4444-444444444444'::uuid
    );
  $$,
  'Admin can add new access entry'
);

-- Test: editor cannot add new access entry
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);

SELECT throws_ok(
  $$
    INSERT INTO public.property_access (
      property_id,
      user_id,
      access_level,
      granted_by
    ) VALUES (
      '99999999-9999-9999-9999-999999999999'::uuid,
      '55555555-5555-5555-5555-555555555555'::uuid,
      'viewer',
      '33333333-3333-3333-3333-333333333333'::uuid
    );
  $$,
  'new row violates row-level security policy',
  'Editor cannot add new access entry'
);

-- Test: viewer cannot add new access entry
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);

SELECT throws_ok(
  $$
    INSERT INTO public.property_access (
      property_id,
      user_id,
      access_level,
      granted_by
    ) VALUES (
      '99999999-9999-9999-9999-999999999999'::uuid,
      '55555555-5555-5555-5555-555555555555'::uuid,
      'viewer',
      '22222222-2222-2222-2222-222222222222'::uuid
    );
  $$,
  'new row violates row-level security policy',
  'Viewer cannot add new access entry'
);

-- Test: property owner can delete access entry
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

SELECT lives_ok(
  $$
    DELETE FROM public.property_access
    WHERE property_id = '99999999-9999-9999-9999-999999999999'::uuid
    AND user_id = '22222222-2222-2222-2222-222222222222'::uuid;
  $$,
  'Property owner can delete access entry'
);

-- Test: admin can delete access entry
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', false);

SELECT lives_ok(
  $$
    DELETE FROM public.property_access
    WHERE property_id = '99999999-9999-9999-9999-999999999999'::uuid
    AND user_id = '33333333-3333-3333-3333-333333333333'::uuid;
  $$,
  'Admin can delete access entry'
);

-- Test: editor cannot delete access entry
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);

SELECT throws_ok(
  $$
    DELETE FROM public.property_access
    WHERE property_id = '99999999-9999-9999-9999-999999999999'::uuid
    AND user_id = '44444444-4444-4444-4444-444444444444'::uuid;
  $$,
  'new row violates row-level security policy',
  'Editor cannot delete access entry'
);

-- Finish the tests and clean up
SELECT * FROM finish();
ROLLBACK; 