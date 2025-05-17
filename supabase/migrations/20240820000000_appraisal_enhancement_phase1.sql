-- Appraisal Enhancement Phase 1: Database Schema Modifications
-- This migration enhances the appraisal system with CoreLogic integration, AI-generated content fields,
-- and agency branding features.

-- ======================================================
-- TASK 1.1: UPDATE APPRAISALS TABLE SCHEMA
-- ======================================================

-- Add CoreLogic property ID field
ALTER TABLE public.appraisals
ADD COLUMN IF NOT EXISTS corelogic_property_id TEXT;

-- Add AI-generated text fields
ALTER TABLE public.appraisals
ADD COLUMN IF NOT EXISTS ai_market_overview TEXT,
ADD COLUMN IF NOT EXISTS ai_property_description TEXT,
ADD COLUMN IF NOT EXISTS ai_comparable_analysis_text TEXT;

-- Add CoreLogic data fields
ALTER TABLE public.appraisals
ADD COLUMN IF NOT EXISTS corelogic_avm_estimate NUMERIC,
ADD COLUMN IF NOT EXISTS corelogic_avm_range_low NUMERIC,
ADD COLUMN IF NOT EXISTS corelogic_avm_range_high NUMERIC,
ADD COLUMN IF NOT EXISTS corelogic_avm_confidence TEXT,
ADD COLUMN IF NOT EXISTS reinz_avm_estimate NUMERIC,
ADD COLUMN IF NOT EXISTS property_activity_summary JSONB,
ADD COLUMN IF NOT EXISTS market_statistics_corelogic JSONB,
ADD COLUMN IF NOT EXISTS market_statistics_reinz JSONB;

-- Create comment on metadata JSONB structure for documentation
COMMENT ON COLUMN public.appraisals.metadata IS 'JSONB structure containing additional data:
{
  "propertyFeatures": ["feature1", "feature2", ...],
  "propertyImages": ["url1", "url2", ...],
  "customFields": {...},
  "apiData": {
    "lastSync": "timestamp",
    "source": "provider name",
    "sourceId": "external reference id"
  }
}';

-- ======================================================
-- TASK 1.2: UPDATE TEAMS TABLE SCHEMA
-- ======================================================

-- Add agency branding fields
ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS agency_logo_url TEXT,
ADD COLUMN IF NOT EXISTS agency_primary_color TEXT,
ADD COLUMN IF NOT EXISTS agency_disclaimer_text TEXT,
ADD COLUMN IF NOT EXISTS agency_contact_details TEXT;

-- ======================================================
-- TASK 1.3: UPDATE PROFILES TABLE
-- ======================================================

-- Add or enhance agent fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS agent_photo_url TEXT,
ADD COLUMN IF NOT EXISTS agent_license_number TEXT;

-- Add additional contact info fields if not comprehensive
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'address') THEN
    ALTER TABLE public.profiles ADD COLUMN address TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'website') THEN
    ALTER TABLE public.profiles ADD COLUMN website TEXT;
  END IF;
END $$;

-- ======================================================
-- UPDATE INDEXES
-- ======================================================

-- Create index for CoreLogic property ID
CREATE INDEX IF NOT EXISTS appraisals_corelogic_id_idx ON public.appraisals(corelogic_property_id);

-- Create indexes for the numerical values for better query performance
CREATE INDEX IF NOT EXISTS appraisals_corelogic_avm_estimate_idx ON public.appraisals(corelogic_avm_estimate);
CREATE INDEX IF NOT EXISTS appraisals_reinz_avm_estimate_idx ON public.appraisals(reinz_avm_estimate);

-- ======================================================
-- UPDATE RLS POLICIES
-- ======================================================

-- Ensure RLS policies are updated to allow access to new fields
-- No changes needed as existing table-level policies cover new fields 
