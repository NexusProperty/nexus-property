-- Create feature_flags table for controlled rollout of features
CREATE TABLE IF NOT EXISTS feature_flags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  percentage INTEGER DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Insert CoreLogic related feature flags
INSERT INTO feature_flags (id, name, description, enabled, percentage)
VALUES 
  ('enable_corelogic_property_data', 'CoreLogic Property Data', 'Enables real CoreLogic property data', false, 0),
  ('enable_corelogic_market_stats', 'CoreLogic Market Statistics', 'Enables CoreLogic market statistics', false, 0);

-- Add RLS policies for feature flags
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Create policy allowing read-only access to authenticated users
CREATE POLICY "Allow authenticated users to read feature flags" ON feature_flags
  FOR SELECT TO authenticated USING (true);

-- Create policy allowing full access to service role
CREATE POLICY "Allow service role to manage feature flags" ON feature_flags
  USING (true) WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON TABLE feature_flags TO authenticated;
GRANT ALL ON TABLE feature_flags TO service_role; 