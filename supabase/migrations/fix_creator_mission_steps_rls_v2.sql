-- Fix: Allow creators to view mission_steps for campaigns where they are assigned
-- either at campaign level (selected_creator_id) OR content level (campaign_contents.assigned_creator_id)

DROP POLICY IF EXISTS "Creators can view assigned campaign steps" ON mission_steps;

CREATE POLICY "Creators can view assigned campaign steps"
  ON mission_steps FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM campaign_contents WHERE campaign_id = mission_steps.campaign_id AND assigned_creator_id = auth.uid())
  );
