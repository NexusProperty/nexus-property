# Verification Scripts

This directory contains scripts to verify the functionality of the Nexus Property application.

## CSRF Protection Verification

The `verify-csrf-protection.js` script verifies that the CSRF protection implementation is working correctly. It tests:

1. Fetching a CSRF token
2. Making a mutation request without a CSRF token (should fail)
3. Making a mutation request with a valid CSRF token (should succeed)

### Prerequisites

- Node.js 14 or higher
- A test user account in the Supabase database

### Setup

1. Install dependencies:

```bash
cd scripts
npm install
```

2. Create a `.env` file with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123
```

### Running the Script

```bash
npm run verify-csrf
```

### Expected Output

If the CSRF protection is working correctly, you should see output similar to:

```
Starting CSRF protection verification...
Signing in as test user...
Successfully signed in as test user
Fetching CSRF token...
Successfully fetched CSRF token
Testing mutation request without CSRF token...
Successfully verified that mutation request without CSRF token fails
Testing mutation request with valid CSRF token...
Successfully verified that mutation request with CSRF token succeeds
Cleaning up test data...
Successfully cleaned up test data
Signing out...
Successfully signed out
CSRF protection verification completed successfully!
```

### Troubleshooting

If the script fails, check:

1. That the test user credentials are correct
2. That the Supabase URL and anon key are correct
3. That the CSRF protection is properly implemented in the database and client
4. That the Edge Function for generating CSRF tokens is deployed and working 

# CSRF Protection Fix Guide

This guide helps you fix the CSRF (Cross-Site Request Forgery) protection issues in the Nexus Property application.

## Current Issues

The verification tests are failing with the following issues:

1. **Profile Creation fails**: The RLS policy on the profiles table is not correctly configured.
2. **Requests without CSRF tokens succeed**: The CSRF protection is not being properly enforced.
3. **Requests with invalid tokens succeed**: Token validation is not working correctly.

## Debugging and Fixing

We've created enhanced debugging tools and an improved SQL fix to address these issues:

### Option 1: Apply the Direct Fix (Recommended)

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (`nexus-property`)
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the contents of the `direct-csrf-fix.sql` file
6. Execute the query
7. Verify the fix worked by running:

```bash
npm run verify-csrf
```

### Option 2: Enhanced Debugging

If the direct fix doesn't solve the problem, use the enhanced debugging tools:

1. Apply the enhanced debugging SQL:
   - Log in to Supabase Dashboard
   - Go to SQL Editor
   - Copy and paste the contents of `debug-csrf-protection.sql`
   - Execute the query

2. Run the enhanced verification script:

```bash
npm run debug-csrf
```

3. Check the detailed output to identify specific issues

## How the Fix Works

The CSRF protection fix implements the following key improvements:

1. **Operation-specific RLS policies**: Instead of one broad policy, we create specific policies for each operation type (SELECT, INSERT, UPDATE, DELETE).

2. **Enhanced token validation**: The `is_csrf_safe()` function now has better error handling and more thorough validation.

3. **Secure token generation**: We use more cryptographically secure token generation using `gen_random_uuid()`.

4. **Better debugging**: Our debugging SQL adds extensive logging to help identify exactly where the protection is failing.

## Available Scripts

- `npm run verify-csrf`: Runs the basic verification script
- `npm run debug-csrf`: Runs the enhanced debugging verification script
- `npm run apply-csrf-fix`: Attempts to apply the fix via API (may not work due to permissions)
- `npm run apply-direct-fix`: Shows instructions for applying the fix directly

## Troubleshooting

If you're still experiencing issues after applying the fix:

1. Check Supabase logs for error messages
2. Verify all RLS policies were created correctly
3. Ensure the pgcrypto extension is installed
4. Check that the CSRF token is being correctly stored in JWT claims
5. Verify that existing policies aren't conflicting with the new ones

## Security Considerations

- CSRF protection is critical for preventing cross-site request forgery attacks
- Always validate tokens for mutation operations (POST, PUT, DELETE, PATCH)
- Test thoroughly after implementing any security-related changes
- Make sure RLS is enabled on all tables storing sensitive data

If you continue to have issues, consider debugging the database directly to see how the token is being stored and validated. 