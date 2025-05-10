-- Enable Row Level Security for teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policies for teams table

-- 1. Team creators can view their own teams
CREATE POLICY "Team creators can view their own teams"
ON teams
FOR SELECT
USING (created_by = auth.uid());

-- 2. Team creators can update their own teams
CREATE POLICY "Team creators can update their own teams"
ON teams
FOR UPDATE
USING (created_by = auth.uid());

-- 3. Team creators can delete their own teams
CREATE POLICY "Team creators can delete their own teams"
ON teams
FOR DELETE
USING (created_by = auth.uid());

-- 4. Team members can view teams they belong to
CREATE POLICY "Team members can view teams they belong to"
ON teams
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = teams.id AND user_id = auth.uid()
  )
);

-- 5. Admins can view all teams
CREATE POLICY "Admins can view all teams"
ON teams
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 6. Admins can update all teams
CREATE POLICY "Admins can update all teams"
ON teams
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 7. Admins can delete all teams
CREATE POLICY "Admins can delete all teams"
ON teams
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
); 