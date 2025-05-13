-- Fix for the reports table index issue
-- First check if the reports table exists, create it if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'reports'
  ) THEN
    -- Create the reports table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.reports (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      appraisal_id UUID NOT NULL REFERENCES public.appraisals(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      version INTEGER NOT NULL DEFAULT 1,
      is_current BOOLEAN DEFAULT true,
      status TEXT NOT NULL CHECK (status IN ('generating', 'completed', 'failed')) DEFAULT 'generating',
      error_message TEXT,
      metadata JSONB DEFAULT '{}'::jsonb
    );

    -- Create trigger for updated_at column
    CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END
$$;

-- Now that we're sure the table exists with all the needed columns,
-- create the indexes if they don't already exist
DROP INDEX IF EXISTS reports_appraisal_idx;
DROP INDEX IF EXISTS reports_user_idx;
DROP INDEX IF EXISTS reports_status_idx;

CREATE INDEX IF NOT EXISTS reports_appraisal_idx ON public.reports(appraisal_id);
CREATE INDEX IF NOT EXISTS reports_user_idx ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);

-- Enable RLS if not already enabled
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Check if RLS policies exist, create them if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'reports' AND policyname = 'reports_view_own'
  ) THEN
    -- Users can view their own reports
    CREATE POLICY reports_view_own ON public.reports
      FOR SELECT USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'reports' AND policyname = 'reports_view_team'
  ) THEN
    -- Team members can view reports for team appraisals
    CREATE POLICY reports_view_team ON public.reports
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.appraisals a
          JOIN public.team_members tm ON a.team_id = tm.team_id
          WHERE a.id = reports.appraisal_id
          AND tm.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'reports' AND policyname = 'reports_insert_own'
  ) THEN
    -- Users can create reports for their own appraisals
    CREATE POLICY reports_insert_own ON public.reports
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.appraisals
          WHERE id = appraisal_id AND user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'reports' AND policyname = 'reports_update_own'
  ) THEN
    -- Users can update their own reports
    CREATE POLICY reports_update_own ON public.reports
      FOR UPDATE USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'reports' AND policyname = 'reports_delete_own'
  ) THEN
    -- Users can delete their own reports
    CREATE POLICY reports_delete_own ON public.reports
      FOR DELETE USING (user_id = auth.uid());
  END IF;
END
$$; 