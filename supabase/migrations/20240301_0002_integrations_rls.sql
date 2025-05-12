-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id)
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'inactive',
  config jsonb,
  team_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES profiles(id)
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

-- 5. Team members can view team integrations
CREATE POLICY "Team members can view team integrations"
ON integrations
FOR SELECT
USING (
  team_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = integrations.team_id AND user_id = auth.uid()
  )
);

-- 6. Team creators can create team integrations
CREATE POLICY "Team creators can create team integrations"
ON integrations
FOR INSERT
WITH CHECK (
  team_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM teams
    WHERE id = team_id AND created_by = auth.uid()
  )
);

-- 7. Team creators can update team integrations
CREATE POLICY "Team creators can update team integrations"
ON integrations
FOR UPDATE
USING (
  team_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM teams
    WHERE id = team_id AND created_by = auth.uid()
  )
);

-- 8. Team creators can delete team integrations
CREATE POLICY "Team creators can delete team integrations"
ON integrations
FOR DELETE
USING (
  team_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM teams
    WHERE id = team_id AND created_by = auth.uid()
  )
);

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