-- Create market data cache table for storing REINZ market data
CREATE TABLE IF NOT EXISTS market_data_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add index on created_at for efficient cache cleanup
CREATE INDEX idx_market_data_cache_created_at ON market_data_cache(created_at);

-- Enable Row Level Security
ALTER TABLE market_data_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for service role to manage cache
CREATE POLICY "Allow service role to manage market data cache" ON market_data_cache 
  USING (true) WITH CHECK (true);

-- Grant access to appropriate roles
GRANT ALL ON TABLE market_data_cache TO authenticated;
GRANT ALL ON TABLE market_data_cache TO service_role;

-- Create appraisal data requests table for analytics
CREATE TABLE IF NOT EXISTS appraisal_data_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  property_id TEXT,
  address TEXT,
  suburb TEXT,
  city TEXT,
  has_property_data BOOLEAN DEFAULT false,
  has_comparables BOOLEAN DEFAULT false,
  has_market_data BOOLEAN DEFAULT false,
  has_avm BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add index on user_id for efficient user-specific queries
CREATE INDEX idx_appraisal_data_requests_user_id ON appraisal_data_requests(user_id);

-- Add index on created_at for analytics queries
CREATE INDEX idx_appraisal_data_requests_created_at ON appraisal_data_requests(created_at);

-- Enable Row Level Security
ALTER TABLE appraisal_data_requests ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own requests
CREATE POLICY "Users can view own appraisal data requests" ON appraisal_data_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to create their own appraisal data requests
CREATE POLICY "Users can create own appraisal data requests" ON appraisal_data_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for service role to have full access
CREATE POLICY "Service role has full access to appraisal data requests" ON appraisal_data_requests
  USING (true) WITH CHECK (true);

-- Grant access to appropriate roles
GRANT SELECT, INSERT ON TABLE appraisal_data_requests TO authenticated;
GRANT ALL ON TABLE appraisal_data_requests TO service_role;

-- Create feature flag for REINZ market data
INSERT INTO feature_flags (id, name, description, enabled, percentage)
VALUES 
  ('enable_reinz_market_data', 'REINZ Market Data', 'Enables real REINZ market data integration', false, 0); 