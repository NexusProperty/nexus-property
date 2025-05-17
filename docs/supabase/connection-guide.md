# Supabase Connection Setup

This document outlines the steps taken to connect the AppraisalHub application to Supabase.

## Connection Details

The application is connected to the following Supabase project:

- **Project URL**: https://anrpboahhkahdprohtln.supabase.co
- **Project Reference ID**: anrpboahhkahdprohtln
- **Region**: ap-southeast-2 (Sydney)

## Authentication Keys

The following authentication keys have been set up:

- **Anon Public Key**: For client-side usage
- **Service Role Key**: For server-side operations (Edge Functions)

These keys are stored in the appropriate locations:

1. **Client-side**: In `src/lib/supabase.ts` for use in the frontend application
2. **Server-side**: Set as environment variables for Supabase Edge Functions

## Supabase Client Setup

The Supabase client has been initialized in `src/lib/supabase.ts` with two clients:

1. `supabase` - Using the anon key for regular client-side operations
2. `supabaseAdmin` - Using the service role key for privileged server-side operations (Edge Functions only)

## Edge Functions Configuration

Edge Functions have been configured with the necessary environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

These were set using the `supabase secrets set` command.

## Connection Testing

Connection testing was performed using Node.js scripts in the `scripts/` directory:

- `test-supabase-connection.js` - Tests basic connectivity using the anon key
- `test-supabase-service-role.js` - Tests service role access

Both tests were successful, confirming that:

1. The basic authentication system is working
2. The service role has the necessary privileges

## Next Steps

1. Apply database migrations to create the necessary schema
2. Set up Row Level Security (RLS) policies
3. Configure storage buckets
4. Deploy and test Edge Functions 