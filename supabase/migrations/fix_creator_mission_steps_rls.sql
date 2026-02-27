-- Fix: Allow creators to insert/update mission_steps for their assigned campaigns
-- This enables the creator to complete their own steps (contract_signed, creator_accepted, etc.)

-- Creator can INSERT steps for campaigns assigned to them
DROP POLICY IF EXISTS "Creators can insert own mission steps" ON mission_steps;
CREATE POLICY "Creators can insert own mission steps"
  ON mission_steps FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
  );

-- Creator can UPDATE steps for campaigns assigned to them  
DROP POLICY IF EXISTS "Creators can update own mission steps" ON mission_steps;
CREATE POLICY "Creators can update own mission steps"
  ON mission_steps FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
  );

-- Also allow creators to read/send messages on their campaigns (fix for messaging)
DROP POLICY IF EXISTS "Creators can view campaign messages" ON messages;
CREATE POLICY "Creators can view campaign messages"
  ON messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "Creators can send campaign messages" ON messages;
CREATE POLICY "Creators can send campaign messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid())
  );

-- Also allow creators to update campaigns for their assigned missions (e.g. status changes)
DROP POLICY IF EXISTS "Creators can update assigned campaigns" ON campaigns;
CREATE POLICY "Creators can update assigned campaigns"
  ON campaigns FOR UPDATE
  USING (selected_creator_id = auth.uid());
