# Supabase Configuration Setup Guide

This guide explains how to set up and configure Supabase for the Nexus Property application.

## Environment Variables

The application uses environment variables to securely configure the Supabase connection. You'll need to set these up before running the application.

### Required Variables

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key (for client-side access)

### Optional Variables (for server-side operations)

- `VITE_SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)
  - ⚠️ **IMPORTANT**: Never expose this key in client-side code or commit it to version control
  - Only use this key in secure server environments (Edge Functions, backend services)

## Setup Steps

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in the `.env.local` file:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   # VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. Run the verification script to ensure your connection is working:
   ```bash
   npm run verify:supabase
   ```

## Edge Functions Environment

For Supabase Edge Functions, you need to set the same environment variables in the Supabase dashboard.

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Under "Project API keys", copy your project URL, anon key, and service role key
4. Go to Edge Functions > Settings
5. Add the following environment variables:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_ANON_KEY`: Your anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## Security Best Practices

1. **Never hardcode credentials** in your application code
2. **Never commit `.env.local`** to version control
3. **Restrict service role key usage** to server-side code only
4. **Configure Row Level Security (RLS) policies** for all tables
5. **Use the anon key** for all client-side operations
6. **Validate all inputs** in Edge Functions and server-side code

## Troubleshooting

If you encounter connection issues:

1. Verify your environment variables are correctly set
2. Check that your IP address is not blocked in Supabase
3. Ensure your project is active and not in maintenance mode
4. Run the verification script: `npm run verify:supabase`
5. Check browser console for any CORS-related errors

For more help, refer to the [Supabase documentation](https://supabase.com/docs) or open an issue in the project repository. 