-- This migration sets up the initial schema with appropriate RLS policies
-- Creates profiles, teams, team_members, properties, and appraisals tables
-- Sets up appropriate indexes and constraints
-- Implements RLS policies for secure data access

-- Note: We'll enable RLS on each table individually instead of setting a database-wide default
-- ALTER DATABASE postgres SET default_row_level_security = on;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
-- Stores extended user information for auth.users
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

-- Appraisals table
-- For storing property appraisal data
CREATE TABLE IF NOT EXISTS public.appraisals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  property_id UUID REFERENCES public.properties(id),
  property_address TEXT NOT NULL,
  property_suburb TEXT NOT NULL,
  property_city TEXT NOT NULL,
  property_type TEXT NOT NULL,
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  land_size NUMERIC(10,2),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  valuation_low NUMERIC(12,2),
  valuation_high NUMERIC(12,2),
  market_analysis TEXT,
  property_description TEXT,
  comparables_commentary TEXT,
  report_url TEXT,
  is_public BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table for storing comparable properties for appraisals
CREATE TABLE IF NOT EXISTS public.comparable_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  appraisal_id UUID NOT NULL REFERENCES public.appraisals(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  suburb TEXT NOT NULL,
  city TEXT NOT NULL,
  sale_date TIMESTAMPTZ,
  sale_price NUMERIC(12,2),
  property_type TEXT NOT NULL,
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  land_size NUMERIC(10,2),
  year_built INTEGER,
  distance_km NUMERIC(5,2),
  similarity_score NUMERIC(5,2),
  image_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appraisals_updated_at
BEFORE UPDATE ON public.appraisals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comparable_properties_updated_at
BEFORE UPDATE ON public.comparable_properties
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for common query patterns
CREATE INDEX idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX idx_appraisals_user_id ON public.appraisals(user_id);
CREATE INDEX idx_appraisals_property_id ON public.appraisals(property_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_comparable_properties_appraisal_id ON public.comparable_properties(appraisal_id);

-- Set up RLS policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparable_properties ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can read their own profile
CREATE POLICY profiles_read_own ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admin users can read all profiles
CREATE POLICY profiles_read_all_admin ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teams policies
-- Team owners and admins can read their team
CREATE POLICY teams_read_own ON public.teams
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = public.teams.id
      AND user_id = auth.uid()
    )
  );

-- Only team owners can update team details
CREATE POLICY teams_update_own ON public.teams
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Only team owners can delete teams
CREATE POLICY teams_delete_own ON public.teams
  FOR DELETE
  USING (owner_id = auth.uid());

-- Any authenticated agent can create a team
CREATE POLICY teams_insert ON public.teams
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'agent'
    )
  );

-- Team members policies
-- Team owners and admins can read all team members
CREATE POLICY team_members_read ON public.team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = public.team_members.team_id
      AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.team_members
          WHERE team_id = public.teams.id
          AND user_id = auth.uid()
          AND role = 'admin'
        )
      )
    )
  );

-- Team owners and admins can manage team members
CREATE POLICY team_members_insert ON public.team_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = public.team_members.team_id
      AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.team_members
          WHERE team_id = public.teams.id
          AND user_id = auth.uid()
          AND role = 'admin'
        )
      )
    )
  );

-- Properties policies
-- Users can read properties they own
CREATE POLICY properties_read_own ON public.properties
  FOR SELECT
  USING (owner_id = auth.uid());

-- Users can read properties if they're public
CREATE POLICY properties_read_public ON public.properties
  FOR SELECT
  USING (is_public = true);

-- Team members can read their team's properties
CREATE POLICY properties_read_team ON public.properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      JOIN public.teams ON public.team_members.team_id = public.teams.id
      WHERE public.team_members.user_id = auth.uid()
      AND public.teams.owner_id = public.properties.owner_id
    )
  );

-- Users can update properties they own
CREATE POLICY properties_update_own ON public.properties
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Appraisals policies
-- Users can read their own appraisals
CREATE POLICY appraisals_read_own ON public.appraisals
  FOR SELECT
  USING (user_id = auth.uid());

-- Team members can read team appraisals
CREATE POLICY appraisals_read_team ON public.appraisals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      JOIN public.teams ON public.team_members.team_id = public.teams.id
      WHERE public.team_members.user_id = auth.uid()
      AND public.teams.owner_id = public.appraisals.user_id
    )
  );

-- Users can read public appraisals
CREATE POLICY appraisals_read_public ON public.appraisals
  FOR SELECT
  USING (is_public = true);

-- Users can update their own appraisals
CREATE POLICY appraisals_update_own ON public.appraisals
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can create new appraisals
CREATE POLICY appraisals_insert ON public.appraisals
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Comparable properties policies
-- Anyone who can read the parent appraisal can read the comparable properties
CREATE POLICY comparable_properties_read ON public.comparable_properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appraisals
      WHERE id = public.comparable_properties.appraisal_id
      AND (
        user_id = auth.uid() OR
        is_public = true OR
        EXISTS (
          SELECT 1 FROM public.team_members
          JOIN public.teams ON public.team_members.team_id = public.teams.id
          WHERE public.team_members.user_id = auth.uid()
          AND public.teams.owner_id = public.appraisals.user_id
        )
      )
    )
  );

-- Only appraisal owners can modify comparable properties
CREATE POLICY comparable_properties_insert ON public.comparable_properties
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appraisals
      WHERE id = public.comparable_properties.appraisal_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY comparable_properties_update ON public.comparable_properties
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.appraisals
      WHERE id = public.comparable_properties.appraisal_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY comparable_properties_delete ON public.comparable_properties
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.appraisals
      WHERE id = public.comparable_properties.appraisal_id
      AND user_id = auth.uid()
    )
  ); 