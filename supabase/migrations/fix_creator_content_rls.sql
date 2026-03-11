-- ================================================
-- Fix RLS: Allow creators to view campaign_contents
-- where they are assigned at the content level
-- (assigned_creator_id) in addition to campaign level
-- ================================================

-- Drop existing creator policy
DROP POLICY IF EXISTS "Creator can view assigned campaign contents" ON campaign_contents;

-- Recreate with both checks: campaign-level OR content-level assignment
CREATE POLICY "Creator can view assigned campaign contents" ON campaign_contents FOR SELECT
  USING (
    assigned_creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
  );
