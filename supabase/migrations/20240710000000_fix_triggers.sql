-- Migration to fix duplicate triggers and other schema issues
-- This will be applied after the other migrations

-- First drop all existing triggers to prevent duplication errors
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
DROP TRIGGER IF EXISTS update_appraisals_updated_at ON public.appraisals;
DROP TRIGGER IF EXISTS update_comparable_properties_updated_at ON public.comparable_properties;
DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;

-- Ensure the function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate all triggers correctly
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

-- Add team_id column to appraisals if it doesn't exist
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

-- Create missing indexes
CREATE INDEX IF NOT EXISTS appraisals_team_idx ON public.appraisals(team_id);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS properties_address_idx ON public.properties USING GIN (to_tsvector('english', address || ' ' || suburb || ' ' || city));
CREATE INDEX IF NOT EXISTS appraisals_address_idx ON public.appraisals USING GIN (to_tsvector('english', property_address || ' ' || property_suburb || ' ' || property_city)); 