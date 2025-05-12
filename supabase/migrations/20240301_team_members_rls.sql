-- Enable Row Level Security for team_members table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for team_members table

-- 1. Team creators can view members of their teams
CREATE POLICY "Team creators can view members of their teams"
ON team_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id AND teams.created_by = auth.uid()
  )
);

-- 2. Team creators can add members to their teams
CREATE POLICY "Team creators can add members to their teams"
ON team_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_id AND teams.created_by = auth.uid()
  )
);

-- 3. Team creators can update members of their teams
CREATE POLICY "Team creators can update members of their teams"
ON team_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id AND teams.created_by = auth.uid()
  )
);

-- 4. Team creators can remove members from their teams
CREATE POLICY "Team creators can remove members from their teams"
ON team_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_members.team_id AND teams.created_by = auth.uid()
  )
);

-- 5. Team members can view other members of their teams
CREATE POLICY "Team members can view other members of their teams"
ON team_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members AS tm
    WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
  )
);

-- 6. Admins can view all team members
CREATE POLICY "Admins can view all team members"
ON team_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 7. Admins can add team members
CREATE POLICY "Admins can add team members"
ON team_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 8. Admins can update team members
CREATE POLICY "Admins can update team members"
ON team_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 9. Admins can delete team members
CREATE POLICY "Admins can delete team members"
ON team_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
); 