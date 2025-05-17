-- Create property_data_cache table for storing CoreLogic API responses
CREATE TABLE IF NOT EXISTS property_data_cache (
  property_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_property_data_cache_created_at ON property_data_cache(created_at);
ALTER TABLE property_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role to manage cache" ON property_data_cache 
  USING (true) WITH CHECK (true);

GRANT ALL ON TABLE property_data_cache TO authenticated;
GRANT ALL ON TABLE property_data_cache TO service_role; 