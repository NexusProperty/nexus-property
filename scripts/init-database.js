// Script to initialize the database schema directly via the Supabase client
import { createClient } from '@supabase/supabase-js';

// Supabase URL and keys
const supabaseUrl = 'https://anrpboahhkahdprohtln.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFucnBib2FoaGthaGRwcm9odGxuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAyNjQ3NCwiZXhwIjoyMDYyNjAyNDc0fQ.NPX8AFgZe_6h1Cxf2TfiycJYDKS_hU99_1-4QV-FlyE';

// Create the Supabase admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// SQL for creating the initial schema
const createSchemaSQL = `
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
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
  valuation_confidence NUMERIC(5,2),
  status TEXT NOT NULL CHECK (status IN ('draft', 'processing', 'completed', 'failed', 'archived')) DEFAULT 'draft',
  report_url TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ai_content JSONB DEFAULT '{}'::jsonb
);

-- Comparable properties table
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

-- Reports table
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

-- Notifications table
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update the updated_at column
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

CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparable_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies

-- Profiles: users can read/update their own profile
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Properties: users can read/update/delete their own properties
CREATE POLICY properties_select ON public.properties FOR SELECT USING (owner_id = auth.uid() OR is_public = true);
CREATE POLICY properties_insert ON public.properties FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY properties_update ON public.properties FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY properties_delete ON public.properties FOR DELETE USING (owner_id = auth.uid());

-- Appraisals: users can read/update/delete their own appraisals
CREATE POLICY appraisals_select ON public.appraisals FOR SELECT USING (user_id = auth.uid());
CREATE POLICY appraisals_insert ON public.appraisals FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY appraisals_update ON public.appraisals FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY appraisals_delete ON public.appraisals FOR DELETE USING (user_id = auth.uid());

-- Notifications: users can read/update their own notifications
CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY notifications_insert ON public.notifications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY notifications_delete ON public.notifications FOR DELETE USING (user_id = auth.uid());
`;

// Function to initialize the database schema
async function initializeDatabase() {
  console.log('Initializing database schema...');
  
  try {
    // Execute the SQL to create the schema
    const { error } = await supabaseAdmin.rpc('pgcli', { 
      query: createSchemaSQL 
    });
    
    if (error) {
      console.error('Failed to initialize database schema:', error.message);
      
      // Try alternative method directly with SQL query
      console.log('Trying alternative method...');
      const { data, error: sqlError } = await supabaseAdmin.from('_experimental_schema_sql').select('*').eq('name', 'init').single();
      
      if (sqlError) {
        throw new Error(`Failed to initialize database: ${sqlError.message}`);
      }
      
      console.log('Database schema initialized successfully!');
      return true;
    }
    
    console.log('Database schema initialized successfully!');
    return true;
  } catch (err) {
    console.error('Unexpected error during database initialization:', err);
    return false;
  }
}

// Run the initialization
initializeDatabase().then((success) => {
  if (success) {
    console.log('✅ Database initialization complete');
  } else {
    console.log('❌ Database initialization failed');
    process.exit(1);
  }
}); 