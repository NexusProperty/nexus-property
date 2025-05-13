# Fixing Supabase Database Connection Issues

There are two main issues with the database schema migrations:

1. **Original Error** - Missing column:
   ```
   ERROR: column "team_id" does not exist (SQLSTATE 42703)
   ```
   This occurs because the first migration creates a basic appraisals table without a team_id column, but the second migration tries to create an index on this non-existent column.

2. **New Error** - Duplicate trigger:
   ```
   ERROR: trigger "update_profiles_updated_at" for relation "profiles" already exists (SQLSTATE 42710)
   ```
   This happens because multiple migrations are trying to create the same triggers.

## Fix Instructions

### Option 1: Using the Supabase Dashboard SQL Editor (Recommended)

1. Log in to the [Supabase Dashboard](https://app.supabase.com/)
2. Select the "anrpboahhkahdprohtln" project
3. Navigate to the "SQL Editor" section
4. Create a new SQL query
5. Copy and paste the contents of the `scripts/fix-db-errors.sql` file
6. Execute the query

This script will:
- Drop and recreate all triggers to avoid duplication errors
- Add the missing `team_id` column to the appraisals table
- Create any missing indexes
- Add other missing fields to the appraisals table
- Create and configure the notifications table

### Option 2: Reset the Database and Apply Migrations

If you prefer to reset the database and apply the migrations cleanly:

1. Use the Supabase Dashboard to reset the database
   - Go to Project Settings > Database > Reset Database
   - **Warning**: This will delete all data!

2. Update the migration files to fix the issues
   - Edit `supabase/migrations/20240501000000_initial_schema.sql` to include the `team_id` column
   - Edit `supabase/migrations/20240520000000_complete_schema.sql` to check for existing triggers
   - Add `DROP TRIGGER IF EXISTS` statements before creating each trigger

3. Run the migrations again
   ```bash
   supabase db reset
   ```

### Option 3: Update Migrations and Skip Errors

If you want to keep existing migrations but skip the errors:

1. Create a new migration file with a timestamp after the existing ones
2. Add the fix script contents to this new migration
3. Run the migrations with the `--skip-errors` flag
   ```bash
   supabase db push --skip-errors
   ```

## After Fixing

After applying the fix, verify that:

1. The structure is correct by checking the database tables in the Supabase Dashboard
2. The client connection works by running the test scripts again
3. Edge Functions can be deployed successfully

If everything is working correctly, you can proceed with deploying the Edge Functions as described in `edge-functions-setup.md`. 