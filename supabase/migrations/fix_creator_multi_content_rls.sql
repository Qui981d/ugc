-- ============================================================
-- COMPREHENSIVE FIX: All creator RLS policies for multi-content campaigns
-- Adds campaign_contents.assigned_creator_id check everywhere
-- ============================================================

-- 1. mission_steps SELECT (already fixed separately, but included for completeness)
DROP POLICY IF EXISTS "Creators can view assigned campaign steps" ON mission_steps;
CREATE POLICY "Creators can view assigned campaign steps"
  ON mission_steps FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM campaign_contents WHERE campaign_id = mission_steps.campaign_id AND assigned_creator_id = auth.uid())
  );

-- 2. mission_steps INSERT
DROP POLICY IF EXISTS "Creators can insert own mission steps" ON mission_steps;
CREATE POLICY "Creators can insert own mission steps"
  ON mission_steps FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM campaign_contents WHERE campaign_id = mission_steps.campaign_id AND assigned_creator_id = auth.uid())
  );

-- 3. mission_steps UPDATE
DROP POLICY IF EXISTS "Creators can update own mission steps" ON mission_steps;
CREATE POLICY "Creators can update own mission steps"
  ON mission_steps FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM campaign_contents WHERE campaign_id = mission_steps.campaign_id AND assigned_creator_id = auth.uid())
  );

-- 4. campaigns UPDATE (creator needs to update contract_mosh_status when signing)
DROP POLICY IF EXISTS "Creators can update assigned campaigns" ON campaigns;
CREATE POLICY "Creators can update assigned campaigns"
  ON campaigns FOR UPDATE
  USING (
    selected_creator_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM campaign_contents WHERE campaign_id = campaigns.id AND assigned_creator_id = auth.uid())
  );

-- 5. messages SELECT for content-level creators
DROP POLICY IF EXISTS "Creators can view campaign messages" ON messages;
CREATE POLICY "Creators can view campaign messages"
  ON messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM campaign_contents WHERE campaign_id = messages.campaign_id AND assigned_creator_id = auth.uid())
  );

-- 6. messages INSERT for content-level creators
DROP POLICY IF EXISTS "Creators can send campaign messages" ON messages;
CREATE POLICY "Creators can send campaign messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND (
      EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
      OR
      EXISTS (SELECT 1 FROM campaign_contents WHERE campaign_id = messages.campaign_id AND assigned_creator_id = auth.uid())
    )
  );
