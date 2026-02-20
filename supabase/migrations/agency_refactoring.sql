-- ================================================
-- AGENCY MODEL REFACTORING
-- Migrate from P2P marketplace to MOSH-mediated workflow
-- ================================================

-- 1. Add 'admin' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- 2. Add new enums for mission workflow
CREATE TYPE mission_step_type AS ENUM (
  'brief_received',
  'creators_proposed',
  'creator_validated',
  'script_sent',
  'video_delivered',
  'video_validated',
  'video_sent_to_brand'
);

CREATE TYPE script_status AS ENUM (
  'draft',
  'pending_validation',
  'validated'
);

-- 3. Add agency columns to campaigns
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS selected_creator_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS script_content TEXT,
  ADD COLUMN IF NOT EXISTS script_status script_status DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS pricing_pack TEXT; -- '1_video', '3_videos', 'custom'

-- 4. Create mission_steps table for workflow tracking
CREATE TABLE IF NOT EXISTS mission_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  step_type mission_step_type NOT NULL,
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- One step type per campaign
  UNIQUE(campaign_id, step_type)
);

-- RLS for mission_steps
ALTER TABLE mission_steps ENABLE ROW LEVEL SECURITY;

-- Admin can do everything on mission_steps
CREATE POLICY "Admin full access to mission_steps"
  ON mission_steps FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Brands can view steps for their campaigns
CREATE POLICY "Brands can view own campaign steps"
  ON mission_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()
  ));

-- Creators can view steps for campaigns they're assigned to
CREATE POLICY "Creators can view assigned campaign steps"
  ON mission_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid()
  ));

-- 5. Add Admin RLS policies to all existing tables

-- Admin: full access to users
CREATE POLICY "Admin full access to users"
  ON users FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Admin: full access to profiles_brand
CREATE POLICY "Admin full access to profiles_brand"
  ON profiles_brand FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Admin: full access to profiles_creator
CREATE POLICY "Admin full access to profiles_creator"
  ON profiles_creator FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Admin: full access to campaigns
CREATE POLICY "Admin full access to campaigns"
  ON campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Admin: full access to applications
CREATE POLICY "Admin full access to applications"
  ON applications FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Admin: full access to deliverables
CREATE POLICY "Admin full access to deliverables"
  ON deliverables FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Admin: full access to messages
CREATE POLICY "Admin full access to messages"
  ON messages FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Admin: full access to conversations
CREATE POLICY "Admin full access to conversations"
  ON conversations FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Admin: full access to notifications
CREATE POLICY "Admin full access to notifications"
  ON notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 6. Update campaign policies for agency model
-- Creators can now only see campaigns they are assigned to (not all open ones)
-- Drop the old marketplace policy first
DROP POLICY IF EXISTS "Creators can view available campaigns" ON campaigns;

-- New policy: creators see only their assigned campaigns
CREATE POLICY "Creators can view assigned campaigns"
  ON campaigns FOR SELECT
  USING (
    selected_creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM applications
      WHERE applications.campaign_id = campaigns.id
      AND applications.creator_id = auth.uid()
    )
  );

-- 7. Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_campaigns_assigned_admin ON campaigns(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_selected_creator ON campaigns(selected_creator_id);
CREATE INDEX IF NOT EXISTS idx_mission_steps_campaign ON mission_steps(campaign_id);

-- 8. Trigger for mission_steps
CREATE TRIGGER update_mission_steps_updated_at
  BEFORE UPDATE ON mission_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
