-- ================================================
-- UGC SUISSE - Database Schema
-- Supabase PostgreSQL with Row Level Security
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- ENUMS
-- ================================================

CREATE TYPE user_role AS ENUM ('brand', 'creator');
CREATE TYPE campaign_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE deliverable_status AS ENUM ('pending', 'review', 'revision_requested', 'approved', 'rejected');
CREATE TYPE rights_usage_type AS ENUM ('organic', 'paid_3m', 'paid_6m', 'paid_12m', 'perpetual');
CREATE TYPE video_format AS ENUM ('9_16', '16_9', '1_1', '4_5');
CREATE TYPE script_type AS ENUM ('testimonial', 'unboxing', 'asmr', 'tutorial', 'lifestyle', 'review');

-- ================================================
-- USERS TABLE
-- Core user data linked to Supabase Auth
-- ================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ================================================
-- PROFILES_BRAND TABLE
-- Extended profile for brand/company users
-- ================================================

CREATE TABLE profiles_brand (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  -- Swiss UID format: CHE-xxx.xxx.xxx
  uid_number TEXT CHECK (uid_number ~ '^CHE-[0-9]{3}\.[0-9]{3}\.[0-9]{3}$'),
  website TEXT,
  industry TEXT,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for profiles_brand
ALTER TABLE profiles_brand ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can view own profile"
  ON profiles_brand FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Brands can update own profile"
  ON profiles_brand FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Brands can insert own profile"
  ON profiles_brand FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Creators can view brand profiles (for marketplace)
CREATE POLICY "Creators can view brand profiles"
  ON profiles_brand FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'creator'
  ));

-- ================================================
-- PROFILES_CREATOR TABLE
-- Extended profile for content creator users
-- ================================================

CREATE TABLE profiles_creator (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  portfolio_video_urls TEXT[] DEFAULT '{}',
  location_canton TEXT,
  languages TEXT[] DEFAULT '{fr}',
  specialties script_type[] DEFAULT '{}',
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  hourly_rate_chf DECIMAL(10,2),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for profiles_creator
ALTER TABLE profiles_creator ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own profile"
  ON profiles_creator FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Creators can update own profile"
  ON profiles_creator FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Creators can insert own profile"
  ON profiles_creator FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Brands can view creator profiles (for marketplace)
CREATE POLICY "Brands can view creator profiles"
  ON profiles_creator FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'brand'
  ));

-- ================================================
-- CAMPAIGNS TABLE
-- Briefs created by brands
-- ================================================

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  
  -- Product details
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_requires_shipping BOOLEAN DEFAULT false,
  
  -- Video specifications
  format video_format NOT NULL DEFAULT '9_16',
  script_type script_type NOT NULL,
  script_notes TEXT,
  
  -- Rights & Usage
  rights_usage rights_usage_type NOT NULL DEFAULT 'organic',
  
  -- Budget (CHF)
  budget_chf DECIMAL(10,2) NOT NULL,
  
  -- Status
  status campaign_status DEFAULT 'draft' NOT NULL,
  
  -- Deadline
  deadline DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Brands can manage their own campaigns
CREATE POLICY "Brands can view own campaigns"
  ON campaigns FOR SELECT
  USING (auth.uid() = brand_id);

CREATE POLICY "Brands can insert own campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (auth.uid() = brand_id);

CREATE POLICY "Brands can update own campaigns"
  ON campaigns FOR UPDATE
  USING (auth.uid() = brand_id);

CREATE POLICY "Brands can delete draft campaigns"
  ON campaigns FOR DELETE
  USING (auth.uid() = brand_id AND status = 'draft');

-- Creators can view open campaigns
CREATE POLICY "Creators can view open campaigns"
  ON campaigns FOR SELECT
  USING (
    status = 'open' AND 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'creator')
  );

-- ================================================
-- APPLICATIONS TABLE
-- Creator applications to campaigns
-- ================================================

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pitch_message TEXT,
  proposed_rate_chf DECIMAL(10,2),
  status application_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicate applications
  UNIQUE(campaign_id, creator_id)
);

-- RLS for applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own applications
CREATE POLICY "Creators can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = creator_id);

-- Brands can view applications for their campaigns
CREATE POLICY "Brands can view campaign applications"
  ON applications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()
  ));

-- Brands can update application status
CREATE POLICY "Brands can update application status"
  ON applications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()
  ));

-- ================================================
-- DELIVERABLES TABLE
-- Video uploads from creators
-- ================================================

CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Video file
  video_url TEXT NOT NULL,
  video_duration_seconds INTEGER,
  thumbnail_url TEXT,
  
  -- Watermark status
  is_watermarked BOOLEAN DEFAULT true,
  
  -- Review
  status deliverable_status DEFAULT 'pending' NOT NULL,
  revision_notes TEXT,
  
  -- Rights transfer
  rights_transferred_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for deliverables
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own deliverables
CREATE POLICY "Creators can view own deliverables"
  ON deliverables FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert deliverables"
  ON deliverables FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own deliverables"
  ON deliverables FOR UPDATE
  USING (auth.uid() = creator_id);

-- Brands can view deliverables for their campaigns
CREATE POLICY "Brands can view campaign deliverables"
  ON deliverables FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()
  ));

-- Brands can update deliverable status
CREATE POLICY "Brands can update deliverable status"
  ON deliverables FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()
  ));

-- ================================================
-- MESSAGES TABLE
-- Contextual messaging linked to campaigns
-- ================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for campaigns they're involved in
CREATE POLICY "Users can view campaign messages"
  ON messages FOR SELECT
  USING (
    -- Brand owns the campaign
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid())
    OR
    -- Creator has an accepted application
    EXISTS (
      SELECT 1 FROM applications 
      WHERE campaign_id = messages.campaign_id 
      AND creator_id = auth.uid() 
      AND status = 'accepted'
    )
  );

-- Users can insert messages for campaigns they're involved in
CREATE POLICY "Users can send campaign messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND (
      EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid())
      OR
      EXISTS (
        SELECT 1 FROM applications 
        WHERE campaign_id = messages.campaign_id 
        AND creator_id = auth.uid() 
        AND status = 'accepted'
      )
    )
  );

-- ================================================
-- INDEXES
-- ================================================

CREATE INDEX idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX idx_applications_creator_id ON applications(creator_id);
CREATE INDEX idx_deliverables_campaign_id ON deliverables(campaign_id);
CREATE INDEX idx_messages_campaign_id ON messages(campaign_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_brand_updated_at
  BEFORE UPDATE ON profiles_brand
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_creator_updated_at
  BEFORE UPDATE ON profiles_creator
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at
  BEFORE UPDATE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- CONVERSATIONS TABLE
-- Direct conversations between brands and creators
-- ================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- One conversation per campaign-creator pair
  UNIQUE(campaign_id, creator_id)
);

-- RLS for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = creator_id OR auth.uid() = brand_id);

CREATE POLICY "Users can insert conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = creator_id OR auth.uid() = brand_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() = brand_id);

-- ================================================
-- NOTIFICATION TYPES
-- ================================================

CREATE TYPE notification_type AS ENUM (
  'new_application',       -- Brand: nouvelle candidature
  'message_received',      -- Both: message reçu
  'deliverable_submitted', -- Brand: livrable reçu
  'application_accepted',  -- Creator: candidature acceptée
  'application_rejected'   -- Creator: candidature refusée
);

-- ================================================
-- NOTIFICATIONS TABLE
-- User notifications
-- ================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  reference_id UUID,         -- ID of related object
  reference_type TEXT,       -- 'campaign', 'conversation', 'application'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ================================================
-- NOTIFICATION PREFERENCES TABLE
-- ================================================

CREATE TABLE notification_preferences (
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

-- RLS for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
