-- ============================================================
-- FIX: Allow creators to UPDATE campaign_contents they are assigned to
-- Root cause of "video delivered but MOSH/brand see nothing":
-- creators had SELECT-only on campaign_contents, so the studio upload
-- (video_url + status='uploaded') was silently rejected by RLS.
-- Also re-assert creator write access on mission_steps (idempotent),
-- in case the multi-content RLS migration was never applied.
-- ============================================================

-- 1. campaign_contents UPDATE for assigned creators (content-level OR campaign-level)
DROP POLICY IF EXISTS "Creators can update assigned campaign contents" ON campaign_contents;
CREATE POLICY "Creators can update assigned campaign contents"
  ON campaign_contents FOR UPDATE
  USING (
    assigned_creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
  )
  WITH CHECK (
    assigned_creator_id = auth.uid()
    OR EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
  );

-- 2. mission_steps INSERT for assigned creators (idempotent safety net)
DROP POLICY IF EXISTS "Creators can insert own mission steps" ON mission_steps;
CREATE POLICY "Creators can insert own mission steps"
  ON mission_steps FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
    OR EXISTS (SELECT 1 FROM campaign_contents WHERE campaign_id = mission_steps.campaign_id AND assigned_creator_id = auth.uid())
  );

-- 3. mission_steps UPDATE for assigned creators (upsert needs both INSERT and UPDATE)
DROP POLICY IF EXISTS "Creators can update own mission steps" ON mission_steps;
CREATE POLICY "Creators can update own mission steps"
  ON mission_steps FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
    OR EXISTS (SELECT 1 FROM campaign_contents WHERE campaign_id = mission_steps.campaign_id AND assigned_creator_id = auth.uid())
  );
