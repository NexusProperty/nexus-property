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