-- ================================================
-- AUDIT FIX MIGRATION
-- Run this in Supabase SQL Editor
-- ================================================

-- ================================================================
-- FIX 1: SCHEMA DRIFT — Ensure all tables & ENUMs exist
-- ================================================================

-- Add missing ENUM values
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'deliverable_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'deliverable_revision';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'deliverable_rejected';

-- Ensure notifications table exists
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure notification_preferences table exists
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_new_application BOOLEAN DEFAULT TRUE,
  email_message_received BOOLEAN DEFAULT TRUE,
  email_deliverable BOOLEAN DEFAULT TRUE,
  email_application_status BOOLEAN DEFAULT TRUE,
  push_new_mission BOOLEAN DEFAULT TRUE,
  push_messages BOOLEAN DEFAULT TRUE,
  push_payments BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure conversations table exists
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(campaign_id, creator_id)
);

-- Ensure contract columns exist on applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS contract_status TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS contract_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS contract_generated_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS brand_signed_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS creator_signed_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS brand_sign_ip TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS creator_sign_ip TEXT;

-- Ensure address columns exist on profiles
ALTER TABLE profiles_brand ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles_creator ADD COLUMN IF NOT EXISTS address TEXT;

-- ================================================================
-- FIX 2: RLS — Creators must see campaigns they applied to
-- ================================================================

-- Drop old restrictive policy if it exists, then create a better one
DO $$ BEGIN
  DROP POLICY IF EXISTS "Creators can view open campaigns" ON campaigns;
EXCEPTION WHEN undefined_object THEN null; END $$;

-- New policy: creators see open campaigns AND campaigns they applied to
CREATE POLICY "Creators can view available campaigns"
  ON campaigns FOR SELECT
  USING (
    -- Open campaigns visible to all creators
    (status = 'open' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'creator'))
    OR
    -- Any campaign the creator has applied to (regardless of status)
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.campaign_id = campaigns.id
      AND applications.creator_id = auth.uid()
    )
  );

-- ================================================================
-- FIX 4: Notifications INSERT — Restrict to authenticated users only
-- ================================================================

-- Drop the permissive policy
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
EXCEPTION WHEN undefined_object THEN null; END $$;

-- New policy: only authenticated users can insert, and only for valid recipients
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id != auth.uid()  -- Can't self-notify
  );

-- ================================================================
-- RLS policies for conversations (if missing)
-- ================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = creator_id OR auth.uid() = brand_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = creator_id OR auth.uid() = brand_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own conversations"
    ON conversations FOR UPDATE
    USING (auth.uid() = creator_id OR auth.uid() = brand_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ================================================================
-- RLS policies for notifications (if missing)
-- ================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ================================================================
-- RLS policies for notification_preferences (if missing)
-- ================================================================

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own preferences"
    ON notification_preferences FOR ALL
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ================================================================
-- Missing indexes
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_conversations_creator_id ON conversations(creator_id);
CREATE INDEX IF NOT EXISTS idx_conversations_brand_id ON conversations(brand_id);

-- ================================================================
-- Input validation constraints
-- ================================================================

-- Message content length limit
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_content_length;
ALTER TABLE messages ADD CONSTRAINT messages_content_length CHECK (char_length(content) <= 5000);

-- Campaign validation
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_title_length;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_title_length CHECK (char_length(title) <= 200);
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_budget_range;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_budget_range CHECK (budget_chf >= 0 AND budget_chf <= 1000000);

-- Application pitch length limit
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_pitch_length;
ALTER TABLE applications ADD CONSTRAINT applications_pitch_length CHECK (pitch_message IS NULL OR char_length(pitch_message) <= 2000);

-- Notification message length
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_message_length;
ALTER TABLE notifications ADD CONSTRAINT notifications_message_length CHECK (message IS NULL OR char_length(message) <= 500);
