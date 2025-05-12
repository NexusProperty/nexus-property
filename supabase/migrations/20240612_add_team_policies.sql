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