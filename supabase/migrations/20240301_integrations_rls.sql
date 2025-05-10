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