BEGIN;

-- Load the pgTAP extension
SELECT plan(13);

-- Create test users
SELECT lives_ok(
  $$
    INSERT INTO auth.users (id, email) VALUES 
    ('11111111-1111-1111-1111-111111111111'::uuid, 'user1@example.com'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'user2@example.com'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'user3@example.com'),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'admin@example.com');
  $$,
  'Create test users'
);

-- Create profiles for test users
SELECT lives_ok(
  $$
    INSERT INTO public.profiles (id, email, full_name, role) VALUES 
    ('11111111-1111-1111-1111-111111111111'::uuid, 'user1@example.com', 'User One', 'agent'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'user2@example.com', 'User Two', 'agent'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'user3@example.com', 'User Three', 'customer'),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'admin@example.com', 'Admin User', 'admin');
  $$,
  'Create profiles for test users'
);

-- Create test properties
SELECT lives_ok(
  $$
    INSERT INTO public.properties (
      id, 
      owner_id, 
      address, 
      suburb, 
      city,
      postcode,
      property_type,
      bedrooms,
      bathrooms
    ) VALUES 
    (
      '10000000-0000-0000-0000-000000000001'::uuid,
      '11111111-1111-1111-1111-111111111111'::uuid,
      '123 User One Street',
      'Suburb1',
      'City1',
      '1234',
      'house',
      3,
      2
    ),
    (
      '20000000-0000-0000-0000-000000000002'::uuid,
      '22222222-2222-2222-2222-222222222222'::uuid,
      '456 User Two Avenue',
      'Suburb2',
      'City2',
      '2345',
      'apartment',
      2,
      1
    ),
    (
      '30000000-0000-0000-0000-000000000003'::uuid,
      '11111111-1111-1111-1111-111111111111'::uuid,
      '789 Public Property Lane',
      'Suburb3',
      'City3',
      '3456',
      'house',
      4,
      3
    );
  $$,
  'Create test properties'
);

-- Make one property public
SELECT lives_ok(
  $$
    UPDATE public.properties 
    SET is_public = true
    WHERE id = '30000000-0000-0000-0000-000000000003'::uuid;
  $$,
  'Set one property as public'
);

-- Add property access for user3 to user1's property
SELECT lives_ok(
  $$
    INSERT INTO public.property_access (
      property_id,
      user_id,
      access_level,
      granted_by
    ) VALUES (
      '10000000-0000-0000-0000-000000000001'::uuid,
      '33333333-3333-3333-3333-333333333333'::uuid,
      'viewer',
      '11111111-1111-1111-1111-111111111111'::uuid
    );
  $$,
  'Create property access entry'
);

-- Test 1: Owner can view their own properties
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

SELECT results_eq(
  $$
    SELECT count(*) FROM public.properties
    WHERE owner_id = '11111111-1111-1111-1111-111111111111'::uuid;
  $$,
  $$SELECT 2::bigint$$,
  'Owner can view all their own properties'
);

-- Test 2: User cannot view properties they don't own
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);

SELECT results_eq(
  $$
    SELECT count(*) FROM public.properties
    WHERE owner_id = '11111111-1111-1111-1111-111111111111'::uuid 
    AND is_public = false;
  $$,
  $$SELECT 0::bigint$$,
  'User cannot view non-public properties they do not own'
);

-- Test 3: Any authenticated user can view public properties
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);

SELECT results_eq(
  $$
    SELECT count(*) FROM public.properties
    WHERE is_public = true;
  $$,
  $$SELECT 1::bigint$$,
  'Any authenticated user can view public properties'
);

-- Test 4: Admin can view all properties
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', false);

SELECT results_eq(
  $$
    SELECT count(*) FROM public.properties;
  $$,
  $$SELECT 3::bigint$$,
  'Admin can view all properties'
);

-- Test 5: User with property access can view the property
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);

SELECT results_eq(
  $$
    SELECT count(*) FROM public.properties
    WHERE id = '10000000-0000-0000-0000-000000000001'::uuid;
  $$,
  $$SELECT 1::bigint$$,
  'User with property access can view the property'
);

-- Test 6: Owner can create a new property
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

SELECT lives_ok(
  $$
    INSERT INTO public.properties (
      owner_id, 
      address, 
      suburb, 
      city,
      property_type
    ) VALUES (
      '11111111-1111-1111-1111-111111111111'::uuid,
      '999 New Property Blvd',
      'NewSuburb',
      'NewCity',
      'townhouse'
    );
  $$,
  'Owner can create a new property'
);

-- Test 7: Owner can update their own property
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

SELECT lives_ok(
  $$
    UPDATE public.properties 
    SET bedrooms = 4
    WHERE id = '10000000-0000-0000-0000-000000000001'::uuid;
  $$,
  'Owner can update their own property'
);

-- Test 8: User cannot update someone else's property
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);

SELECT throws_ok(
  $$
    UPDATE public.properties 
    SET bedrooms = 5
    WHERE id = '10000000-0000-0000-0000-000000000001'::uuid;
  $$,
  'new row violates row-level security policy',
  'User cannot update someone else\'s property'
);

-- Test 9: Owner can delete their own property
SELECT set_config('role', 'postgres', false);
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

SELECT lives_ok(
  $$
    DELETE FROM public.properties
    WHERE id = '10000000-0000-0000-0000-000000000001'::uuid;
  $$,
  'Owner can delete their own property'
);

SELECT * FROM finish();
ROLLBACK; 