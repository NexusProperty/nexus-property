-- Fix script for database errors in Supabase migrations

-- 1. First check and fix the trigger issue
DO $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_profiles_updated_at'
    ) INTO trigger_exists;
    
    -- If trigger exists, drop it first before recreating
    IF trigger_exists THEN
        RAISE NOTICE 'Dropping existing trigger update_profiles_updated_at';
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
    END IF;
END $$;

-- 2. Fix the team_id column issue in appraisals table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appraisals' AND column_name = 'team_id'
    ) THEN
        RAISE NOTICE 'Adding team_id column to appraisals table';
        ALTER TABLE public.appraisals ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
    ELSE
        RAISE NOTICE 'team_id column already exists in appraisals table';
    END IF;
END $$;

-- 3. Create function for updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Safely recreate all triggers (drop first if they exist)
DO $$
BEGIN
    -- Profiles trigger
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
    CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    RAISE NOTICE 'Recreated trigger update_profiles_updated_at';
    
    -- Teams trigger
    DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
    CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    RAISE NOTICE 'Recreated trigger update_teams_updated_at';
    
    -- Team members trigger
    DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
    CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    RAISE NOTICE 'Recreated trigger update_team_members_updated_at';
    
    -- Properties trigger
    DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
    CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    RAISE NOTICE 'Recreated trigger update_properties_updated_at';
    
    -- Appraisals trigger
    DROP TRIGGER IF EXISTS update_appraisals_updated_at ON public.appraisals;
    CREATE TRIGGER update_appraisals_updated_at
    BEFORE UPDATE ON public.appraisals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    RAISE NOTICE 'Recreated trigger update_appraisals_updated_at';
    
    -- Comparable properties trigger
    DROP TRIGGER IF EXISTS update_comparable_properties_updated_at ON public.comparable_properties;
    CREATE TRIGGER update_comparable_properties_updated_at
    BEFORE UPDATE ON public.comparable_properties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    RAISE NOTICE 'Recreated trigger update_comparable_properties_updated_at';
    
    -- Reports trigger (if table exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
        CREATE TRIGGER update_reports_updated_at
        BEFORE UPDATE ON public.reports
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        RAISE NOTICE 'Recreated trigger update_reports_updated_at';
    END IF;
END $$;

-- 5. Create missing indexes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'appraisals' AND indexname = 'appraisals_team_idx'
    ) THEN
        CREATE INDEX appraisals_team_idx ON public.appraisals(team_id);
        RAISE NOTICE 'Created index appraisals_team_idx';
    ELSE
        RAISE NOTICE 'Index appraisals_team_idx already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'profiles' AND indexname = 'profiles_role_idx'
    ) THEN
        CREATE INDEX profiles_role_idx ON public.profiles(role);
        RAISE NOTICE 'Created index profiles_role_idx';
    ELSE
        RAISE NOTICE 'Index profiles_role_idx already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'properties' AND indexname = 'properties_address_idx'
    ) THEN
        CREATE INDEX properties_address_idx ON public.properties USING GIN (to_tsvector('english', address || ' ' || suburb || ' ' || city));
        RAISE NOTICE 'Created index properties_address_idx';
    ELSE
        RAISE NOTICE 'Index properties_address_idx already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'appraisals' AND indexname = 'appraisals_address_idx'
    ) THEN
        CREATE INDEX appraisals_address_idx ON public.appraisals USING GIN (to_tsvector('english', property_address || ' ' || property_suburb || ' ' || property_city));
        RAISE NOTICE 'Created index appraisals_address_idx';
    ELSE
        RAISE NOTICE 'Index appraisals_address_idx already exists';
    END IF;
END $$;

-- 6. Add missing fields to appraisals table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appraisals' AND column_name = 'floor_area'
    ) THEN
        ALTER TABLE public.appraisals ADD COLUMN floor_area NUMERIC(10,2);
        RAISE NOTICE 'Added column floor_area to appraisals table';
    ELSE
        RAISE NOTICE 'Column floor_area already exists in appraisals table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appraisals' AND column_name = 'year_built'
    ) THEN
        ALTER TABLE public.appraisals ADD COLUMN year_built INTEGER;
        RAISE NOTICE 'Added column year_built to appraisals table';
    ELSE
        RAISE NOTICE 'Column year_built already exists in appraisals table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appraisals' AND column_name = 'valuation_confidence'
    ) THEN
        ALTER TABLE public.appraisals ADD COLUMN valuation_confidence NUMERIC(5,2);
        RAISE NOTICE 'Added column valuation_confidence to appraisals table';
    ELSE
        RAISE NOTICE 'Column valuation_confidence already exists in appraisals table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appraisals' AND column_name = 'ai_content'
    ) THEN
        ALTER TABLE public.appraisals ADD COLUMN ai_content JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Added column ai_content to appraisals table';
    ELSE
        RAISE NOTICE 'Column ai_content already exists in appraisals table';
    END IF;
END $$;

-- 7. Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ
);

-- Add trigger for notifications table
DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
    CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    RAISE NOTICE 'Created trigger update_notifications_updated_at';
END $$;

-- 8. Enable RLS on notifications table
DO $$
BEGIN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    
    -- Drop policies first if they exist to avoid duplicates
    DROP POLICY IF EXISTS notifications_select ON public.notifications;
    DROP POLICY IF EXISTS notifications_insert ON public.notifications;
    DROP POLICY IF EXISTS notifications_update ON public.notifications;
    DROP POLICY IF EXISTS notifications_delete ON public.notifications;
    
    -- Create notifications RLS policies
    CREATE POLICY notifications_select ON public.notifications 
        FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY notifications_insert ON public.notifications 
        FOR INSERT WITH CHECK (user_id = auth.uid());
    CREATE POLICY notifications_update ON public.notifications 
        FOR UPDATE USING (user_id = auth.uid());
    CREATE POLICY notifications_delete ON public.notifications 
        FOR DELETE USING (user_id = auth.uid());
        
    RAISE NOTICE 'Enabled RLS and created policies for notifications table';
END $$;

-- 9. Report success
DO $$
BEGIN
    RAISE NOTICE 'Database fix script completed successfully';
END $$; 