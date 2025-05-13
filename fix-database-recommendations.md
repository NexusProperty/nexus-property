# Database Fix Recommendations

I've identified two primary issues with the Supabase database setup:

1. **Missing Column Error**: The `team_id` column is missing from the `appraisals` table
2. **Duplicate Trigger Error**: Multiple migrations are trying to create the same triggers

## Recommended Solution

Since there are issues with running the Supabase CLI commands, I recommend using the SQL Editor in the Supabase Dashboard:

### Step 1: Access SQL Editor in Supabase Dashboard

1. Log in to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project "anrpboahhkahdprohtln"
3. Go to the SQL Editor section (left sidebar)
4. Create a new query

### Step 2: Execute the Fix Script

Copy and paste the following SQL into the editor and run it:

```sql
-- Fix script for database errors in Supabase migrations

-- 1. First check and fix the trigger issue by dropping existing triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
DROP TRIGGER IF EXISTS update_appraisals_updated_at ON public.appraisals;
DROP TRIGGER IF EXISTS update_comparable_properties_updated_at ON public.comparable_properties;
DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;

-- 2. Fix the team_id column issue in appraisals table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appraisals' AND column_name = 'team_id'
    ) THEN
        ALTER TABLE public.appraisals ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Ensure the updated_at function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Recreate all triggers
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appraisals_updated_at
BEFORE UPDATE ON public.appraisals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comparable_properties_updated_at
BEFORE UPDATE ON public.comparable_properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Create required indexes
CREATE INDEX IF NOT EXISTS appraisals_team_idx ON public.appraisals(team_id);
CREATE INDEX IF NOT EXISTS appraisals_user_idx ON public.appraisals(user_id);
CREATE INDEX IF NOT EXISTS appraisals_property_idx ON public.appraisals(property_id);
```

### Step 3: Verify the Fix

After running the script:

1. Go to the "Table Editor" in the Supabase Dashboard
2. Check that the `appraisals` table has a `team_id` column
3. Run a simple test from your application to verify the connection works

### Step 4: Continue with Deployment

Once the database issues are fixed, proceed with deploying your Edge Functions:

1. Ensure Docker Desktop is running (required for Edge Function deployment)
2. Follow the instructions in `edge-functions-setup.md`

## Alternative Options

If you still want to use the CLI approach:

1. Make sure the Supabase CLI is installed correctly:
   ```
   npm install -g supabase
   ```

2. Link your project again and push with skip-errors:
   ```
   supabase link --project-ref anrpboahhkahdprohtln
   supabase db push --skip-errors
   ```

## Additional Notes

- If you're continuously encountering migration issues, consider resetting the database from the Supabase Dashboard, but be aware that this will delete all data
- For future migrations, always include `DROP TRIGGER IF EXISTS` and `CREATE TABLE IF NOT EXISTS` statements to make migrations more robust 