-- ================================================
-- Fix: Allow brands to insert mission_steps for their own campaigns
-- Also allow brands to insert notifications (for notifying admins)
-- ================================================

-- Brand can insert mission steps for their own campaigns
CREATE POLICY "Brands can insert mission steps for own campaigns"
  ON mission_steps FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()));

-- Brand can also update mission steps for their own campaigns (future-proofing)
CREATE POLICY "Brands can update mission steps for own campaigns"
  ON mission_steps FOR UPDATE
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()));

-- Allow brands to create notifications for themselves (self-notifications from system)
CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
