-- Add team_id column to appraisals table if it doesn't exist already
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

-- Recreate any missing indexes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'appraisals' AND indexname = 'appraisals_team_idx'
    ) THEN
        CREATE INDEX appraisals_team_idx ON public.appraisals(team_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'profiles' AND indexname = 'profiles_role_idx'
    ) THEN
        CREATE INDEX profiles_role_idx ON public.profiles(role);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'properties' AND indexname = 'properties_address_idx'
    ) THEN
        CREATE INDEX properties_address_idx ON public.properties USING GIN (to_tsvector('english', address || ' ' || suburb || ' ' || city));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'appraisals' AND indexname = 'appraisals_address_idx'
    ) THEN
        CREATE INDEX appraisals_address_idx ON public.appraisals USING GIN (to_tsvector('english', property_address || ' ' || property_suburb || ' ' || property_city));
    END IF;
END $$;

-- Add missing fields to appraisals table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appraisals' AND column_name = 'floor_area'
    ) THEN
        ALTER TABLE public.appraisals ADD COLUMN floor_area NUMERIC(10,2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appraisals' AND column_name = 'year_built'
    ) THEN
        ALTER TABLE public.appraisals ADD COLUMN year_built INTEGER;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appraisals' AND column_name = 'valuation_confidence'
    ) THEN
        ALTER TABLE public.appraisals ADD COLUMN valuation_confidence NUMERIC(5,2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'appraisals' AND column_name = 'ai_content'
    ) THEN
        ALTER TABLE public.appraisals ADD COLUMN ai_content JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ
);

-- Enable RLS on notifications if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE tablename = 'notifications' AND rowsecurity = true
    ) THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        
        -- Create basic notifications RLS policies
        CREATE POLICY notifications_select ON public.notifications 
            FOR SELECT USING (user_id = auth.uid());
        CREATE POLICY notifications_insert ON public.notifications 
            FOR INSERT WITH CHECK (user_id = auth.uid());
        CREATE POLICY notifications_update ON public.notifications 
            FOR UPDATE USING (user_id = auth.uid());
        CREATE POLICY notifications_delete ON public.notifications 
            FOR DELETE USING (user_id = auth.uid());
    END IF;
END $$; 