# Supabase Setup Guide

This guide explains how to set up Supabase for the AppraisalHub project, both locally for development and in the cloud for staging/production.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- [Docker](https://www.docker.com/) installed (for local development)
- Node.js and npm/yarn installed

## Local Development Setup

### 1. Initialize Supabase Locally

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Initialize Supabase in the project directory
supabase init
```

### 2. Start Local Supabase Services

```bash
# Start local Supabase services
supabase start
```

This will start a local PostgreSQL database and other Supabase services, and print out information including:
- API URL
- GraphQL URL
- Studio URL (admin dashboard)
- JWT Secret
- Anon Key
- Service Role Key

### 3. Apply Migrations

```bash
# Apply existing migrations to set up the database schema
supabase db reset
```

This command applies all migrations in the `supabase/migrations` directory to your local database.

### 4. Create `.env.local` File

Create a `.env.local` file in the project root with your local Supabase credentials:

```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-anon-key-from-supabase-start-output
```

## Cloud Project Setup

### 1. Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.io/)
2. Click "New Project"
3. Enter project details:
   - Name: `appraisalhub-dev` (or appropriate environment name)
   - Database Password: Generate a strong password
   - Region: Select closest to your user base (e.g., Sydney for NZ users)
4. Click "Create New Project"

### 2. Link Local Project to Remote

```bash
# Get the reference ID from your project URL
# e.g., for https://app.supabase.com/project/abcdefghijklmnopqrst
# the reference ID is abcdefghijklmnopqrst

supabase link --project-ref your-project-reference-id
```

### 3. Push Local Schema to Remote

```bash
# Push migrations to remote project
supabase db push
```

### 4. Update Environment Variables

Update your `.env.local` file with the cloud credentials:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-supabase-dashboard
```

For production deployment, set these variables in your deployment platform.

## Authentication Setup

### 1. Configure Email Auth Provider

1. Go to Authentication > Providers in the Supabase Dashboard
2. Ensure "Email" provider is enabled
3. Configure Site URL (for redirects) to your deployed frontend URL
4. Customize email templates if needed

### 2. Add Email Templates

1. Go to Authentication > Email Templates
2. Customize the following templates:
   - Confirmation
   - Invitation
   - Magic Link
   - Recovery (Password Reset)

## Storage Setup

### 1. Create Buckets

1. Go to Storage in the Supabase Dashboard
2. Create the following buckets:
   - `property-images` (private)
   - `reports` (private)
   - `avatars` (private)

### 2. Configure Bucket Policies

1. Go to each bucket's settings
2. Set appropriate access policies:
   - For `property-images`: Owner can upload, view their own, public can view if property is public
   - For `reports`: Owner and team members can view
   - For `avatars`: Owner can upload, authenticated users can view

## API Security

### 1. Verify RLS Policies

1. Go to Database > Policies in the Supabase Dashboard
2. Verify all tables have appropriate RLS policies
3. Test with different user roles to ensure proper access control

### 2. Set Up Hooks (Optional)

1. Go to Database > Hooks
2. Configure any required database triggers or hooks

## Monitoring and Logging

### 1. Enable Database Monitoring

1. Go to Database > Monitoring
2. Configure metrics collection
3. Set up alerts for critical issues

### 2. Set Up API Monitoring

1. Go to Settings > API
2. Enable request logging
3. Configure log retention

## CI/CD Integration

Add the following to your CI/CD pipeline:

```yaml
# Example GitHub Actions job for database migrations
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
          supabase db push
```

## Next Steps

1. Complete TypeScript type generation:
   ```bash
   supabase gen types typescript --local > src/types/supabase.ts
   ```

2. Test authentication flows in the frontend

3. Verify RLS policies are working correctly

4. Set up Edge Functions for serverless features 