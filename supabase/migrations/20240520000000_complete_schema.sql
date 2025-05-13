-- AppraisalHub: Complete Schema Migration
-- This migration implements a comprehensive schema with proper relationships and RLS policies
-- for the AppraisalHub property appraisal platform.

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: We'll enable RLS on each table individually instead of setting a database-wide default
-- ALTER DATABASE postgres SET default_row_level_security = on;

-- ======================================================
-- TABLE DEFINITIONS
-- ======================================================

-- Profiles table
-- Stores extended user information linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('agent', 'customer', 'admin')) DEFAULT 'customer',
  phone TEXT,
  organization TEXT,
  settings JSONB DEFAULT '{}'::jsonb
);

-- Teams table
-- For organizing agents into teams/agencies
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}'::jsonb
);

-- Team members table
-- For linking users to teams with specific roles
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('member', 'admin')) DEFAULT 'member',
  UNIQUE (team_id, user_id)
);

-- Properties table
-- For storing property information
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  suburb TEXT NOT NULL,
  city TEXT NOT NULL,
  postcode TEXT,
  property_type TEXT NOT NULL CHECK (property_type IN ('house', 'apartment', 'townhouse', 'land', 'commercial', 'other')),
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  land_size NUMERIC(10,2),
  floor_area NUMERIC(10,2),
  year_built INTEGER,
  features TEXT[],
  images TEXT[],
  is_public BOOLEAN DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('active', 'archived', 'draft')) DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Check if team_id column exists in appraisals table, if not add it
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

-- Appraisals table
-- For storing property appraisal data
CREATE TABLE IF NOT EXISTS public.appraisals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  property_address TEXT NOT NULL,
  property_suburb TEXT NOT NULL,
  property_city TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('house', 'apartment', 'townhouse', 'land', 'commercial', 'other')),
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  land_size NUMERIC(10,2),
  floor_area NUMERIC(10,2),
  year_built INTEGER,
  valuation_low NUMERIC(12,2),
  valuation_high NUMERIC(12,2),
  valuation_confidence INTEGER CHECK (valuation_confidence BETWEEN 0 AND 100),
  status TEXT NOT NULL CHECK (status IN ('draft', 'processing', 'completed', 'failed', 'archived')) DEFAULT 'draft',
  report_url TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ai_content JSONB DEFAULT '{}'::jsonb
);

-- Comparable properties table
-- For storing properties used for comparison in appraisals
CREATE TABLE IF NOT EXISTS public.comparable_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  appraisal_id UUID NOT NULL REFERENCES public.appraisals(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  suburb TEXT NOT NULL,
  city TEXT NOT NULL,
  property_type TEXT NOT NULL,
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  land_size NUMERIC(10,2),
  floor_area NUMERIC(10,2),
  year_built INTEGER,
  sale_date DATE,
  sale_price NUMERIC(12,2),
  similarity_score INTEGER CHECK (similarity_score BETWEEN 0 AND 100),
  adjustment_factor NUMERIC(5,2) DEFAULT 1.00,
  adjusted_price NUMERIC(12,2),
  notes TEXT,
  image_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Appraisal history table
-- For tracking changes to appraisals
CREATE TABLE IF NOT EXISTS public.appraisal_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  appraisal_id UUID NOT NULL REFERENCES public.appraisals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  changes JSONB DEFAULT '{}'::jsonb
);

-- Reports table
-- For tracking generated PDF reports
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

-- ======================================================
-- INDEXES
-- ======================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

-- Teams indexes
CREATE INDEX IF NOT EXISTS teams_owner_idx ON public.teams(owner_id);

-- Team members indexes
CREATE INDEX IF NOT EXISTS team_members_team_idx ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS team_members_user_idx ON public.team_members(user_id);

-- Properties indexes
CREATE INDEX IF NOT EXISTS properties_owner_idx ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS properties_address_idx ON public.properties USING GIN (to_tsvector('english', address || ' ' || suburb || ' ' || city));
CREATE INDEX IF NOT EXISTS properties_type_idx ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS properties_status_idx ON public.properties(status);

-- Appraisals indexes
CREATE INDEX IF NOT EXISTS appraisals_user_idx ON public.appraisals(user_id);
CREATE INDEX IF NOT EXISTS appraisals_property_idx ON public.appraisals(property_id);
CREATE INDEX IF NOT EXISTS appraisals_status_idx ON public.appraisals(status);
CREATE INDEX IF NOT EXISTS appraisals_team_idx ON public.appraisals(team_id);
CREATE INDEX IF NOT EXISTS appraisals_address_idx ON public.appraisals USING GIN (to_tsvector('english', property_address || ' ' || property_suburb || ' ' || property_city));

-- Comparable properties indexes
CREATE INDEX IF NOT EXISTS comparable_properties_appraisal_idx ON public.comparable_properties(appraisal_id);
CREATE INDEX IF NOT EXISTS comparable_similarity_idx ON public.comparable_properties(similarity_score);

-- Reports indexes
CREATE INDEX IF NOT EXISTS reports_appraisal_idx ON public.reports(appraisal_id);
CREATE INDEX IF NOT EXISTS reports_user_idx ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);

-- ======================================================
-- FUNCTIONS
-- ======================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ======================================================
-- TRIGGERS
-- ======================================================

-- Update timestamps triggers
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

CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ======================================================
-- ROW LEVEL SECURITY POLICIES
-- ======================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparable_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Profile policies
-- Users can view their own profile
CREATE POLICY profiles_view_own ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profiles are automatically inserted via trigger on new user creation
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY profiles_admin_view ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Team policies
-- Team members can view their teams
CREATE POLICY teams_view_member ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = id AND user_id = auth.uid()
    ) OR owner_id = auth.uid()
  );

-- Only team owner can update team
CREATE POLICY teams_update_owner ON public.teams
  FOR UPDATE USING (owner_id = auth.uid());

-- Only agents can create teams
CREATE POLICY teams_insert_agent ON public.teams
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'agent'
    )
  );

-- Only owner can delete team
CREATE POLICY teams_delete_owner ON public.teams
  FOR DELETE USING (owner_id = auth.uid());

-- Team member policies
-- Team members can view other members in their teams
CREATE POLICY team_members_view_member ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members AS tm
      WHERE tm.team_id = team_id AND tm.user_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND owner_id = auth.uid()
    )
  );

-- Only team admins and owners can add members
CREATE POLICY team_members_insert_admin ON public.team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = team_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only team admins and owners can update member roles
CREATE POLICY team_members_update_admin ON public.team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = team_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only team admins and owners can remove members
CREATE POLICY team_members_delete_admin ON public.team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = team_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Property policies
-- Users can view their own properties
CREATE POLICY properties_view_own ON public.properties
  FOR SELECT USING (owner_id = auth.uid() OR is_public = true);

-- Users can update their own properties
CREATE POLICY properties_update_own ON public.properties
  FOR UPDATE USING (owner_id = auth.uid());

-- Users can insert their own properties
CREATE POLICY properties_insert_own ON public.properties
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Users can delete their own properties
CREATE POLICY properties_delete_own ON public.properties
  FOR DELETE USING (owner_id = auth.uid());

-- Appraisal policies
-- Users can view their own appraisals
CREATE POLICY appraisals_view_own ON public.appraisals
  FOR SELECT USING (user_id = auth.uid());

-- Team members can view team appraisals
CREATE POLICY appraisals_view_team ON public.appraisals
  FOR SELECT USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = appraisals.team_id AND user_id = auth.uid()
    )
  );

-- Users can update their own appraisals
CREATE POLICY appraisals_update_own ON public.appraisals
  FOR UPDATE USING (user_id = auth.uid());

-- Team admins can update team appraisals
CREATE POLICY appraisals_update_team_admin ON public.appraisals
  FOR UPDATE USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = appraisals.team_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can insert their own appraisals
CREATE POLICY appraisals_insert_own ON public.appraisals
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can delete their own appraisals
CREATE POLICY appraisals_delete_own ON public.appraisals
  FOR DELETE USING (user_id = auth.uid());

-- Comparable properties policies
-- Users can view comparable properties for their appraisals
CREATE POLICY comparable_properties_view_own ON public.comparable_properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appraisals
      WHERE id = appraisal_id AND user_id = auth.uid()
    )
  );

-- Team members can view comparable properties for team appraisals
CREATE POLICY comparable_properties_view_team ON public.comparable_properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appraisals
      WHERE id = appraisal_id AND team_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = appraisals.team_id AND user_id = auth.uid()
      )
    )
  );

-- Only appraisal owner can insert comparable properties
CREATE POLICY comparable_properties_insert_own ON public.comparable_properties
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appraisals
      WHERE id = appraisal_id AND user_id = auth.uid()
    )
  );

-- Only appraisal owner can update comparable properties
CREATE POLICY comparable_properties_update_own ON public.comparable_properties
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.appraisals
      WHERE id = appraisal_id AND user_id = auth.uid()
    )
  );

-- Only appraisal owner can delete comparable properties
CREATE POLICY comparable_properties_delete_own ON public.comparable_properties
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.appraisals
      WHERE id = appraisal_id AND user_id = auth.uid()
    )
  );

-- Appraisal history policies
-- Users can view history for their own appraisals
CREATE POLICY appraisal_history_view_own ON public.appraisal_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appraisals
      WHERE id = appraisal_id AND user_id = auth.uid()
    )
  );

-- Team members can view history for team appraisals
CREATE POLICY appraisal_history_view_team ON public.appraisal_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appraisals
      WHERE id = appraisal_id AND team_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = appraisals.team_id AND user_id = auth.uid()
      )
    )
  );

-- Report policies
-- Users can view reports for their own appraisals
CREATE POLICY reports_view_own ON public.reports
  FOR SELECT USING (user_id = auth.uid());

-- Team members can view reports for team appraisals
CREATE POLICY reports_view_team ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appraisals
      WHERE id = appraisal_id AND team_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = appraisals.team_id AND user_id = auth.uid()
      )
    )
  );

-- Only appraisal owner can insert reports
CREATE POLICY reports_insert_own ON public.reports
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Only appraisal owner can update reports
CREATE POLICY reports_update_own ON public.reports
  FOR UPDATE USING (user_id = auth.uid());

-- Only appraisal owner can delete reports
CREATE POLICY reports_delete_own ON public.reports
  FOR DELETE USING (user_id = auth.uid()); 