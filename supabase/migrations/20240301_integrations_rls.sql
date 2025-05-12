-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'inactive',
  config jsonb,
  user_id uuid NOT NULL,
  team_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security for integrations table
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Create policies for integrations table

-- 1. Users can view their own integrations
CREATE POLICY "Users can view their own integrations"
ON integrations
FOR SELECT
USING (user_id = auth.uid());

-- 2. Users can create their own integrations
CREATE POLICY "Users can create their own integrations"
ON integrations
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 3. Users can update their own integrations
CREATE POLICY "Users can update their own integrations"
ON integrations
FOR UPDATE
USING (user_id = auth.uid());

-- 4. Users can delete their own integrations
CREATE POLICY "Users can delete their own integrations"
ON integrations
FOR DELETE
USING (user_id = auth.uid());

-- 9. Admins can view all integrations
CREATE POLICY "Admins can view all integrations"
ON integrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 10. Admins can create integrations
CREATE POLICY "Admins can create integrations"
ON integrations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 11. Admins can update all integrations
CREATE POLICY "Admins can update all integrations"
ON integrations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 12. Admins can delete all integrations
CREATE POLICY "Admins can delete all integrations"
ON integrations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
); 
