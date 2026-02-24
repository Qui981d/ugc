-- ================================================
-- UGC SUISSE — FULL DATABASE SETUP
-- Copy-paste this ENTIRE file into Supabase SQL Editor
-- and run it ONCE on a fresh database.
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- ENUMS
-- ================================================

CREATE TYPE user_role AS ENUM ('brand', 'creator');
CREATE TYPE campaign_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn', 'completed');
CREATE TYPE deliverable_status AS ENUM ('pending', 'review', 'revision_requested', 'approved', 'rejected');
CREATE TYPE rights_usage_type AS ENUM ('organic', 'paid_3m', 'paid_6m', 'paid_12m', 'perpetual');
CREATE TYPE video_format AS ENUM ('9_16', '16_9', '1_1', '4_5');
CREATE TYPE script_type AS ENUM ('testimonial', 'unboxing', 'asmr', 'tutorial', 'lifestyle', 'review');
CREATE TYPE notification_type AS ENUM (
  'new_application',
  'message_received',
  'deliverable_submitted',
  'application_accepted',
  'application_rejected',
  'deliverable_approved',
  'deliverable_revision',
  'deliverable_rejected'
);

-- Agency enums
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

-- ================================================
-- USERS TABLE
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

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT TO authenticated USING (true);

-- ================================================
-- PROFILES_BRAND TABLE
-- ================================================

CREATE TABLE profiles_brand (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  uid_number TEXT CHECK (uid_number ~ '^CHE-[0-9]{3}\.[0-9]{3}\.[0-9]{3}$'),
  website TEXT,
  industry TEXT,
  description TEXT,
  logo_url TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE profiles_brand ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can view own profile"
  ON profiles_brand FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Brands can update own profile"
  ON profiles_brand FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Brands can insert own profile"
  ON profiles_brand FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators can view brand profiles"
  ON profiles_brand FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'creator'));

-- ================================================
-- PROFILES_CREATOR TABLE
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
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE profiles_creator ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own profile"
  ON profiles_creator FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Creators can update own profile"
  ON profiles_creator FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Creators can insert own profile"
  ON profiles_creator FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view creator profiles"
  ON profiles_creator FOR SELECT USING (auth.uid() IS NOT NULL);

-- ================================================
-- CAMPAIGNS TABLE
-- ================================================

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_requires_shipping BOOLEAN DEFAULT false,
  format video_format NOT NULL DEFAULT '9_16',
  script_type script_type NOT NULL,
  script_notes TEXT,
  rights_usage rights_usage_type NOT NULL DEFAULT 'organic',
  budget_chf DECIMAL(10,2) NOT NULL,
  status campaign_status DEFAULT 'draft' NOT NULL,
  deadline DATE,
  -- Agency columns
  assigned_admin_id UUID REFERENCES users(id),
  selected_creator_id UUID REFERENCES users(id),
  script_content TEXT,
  script_status script_status DEFAULT 'draft',
  pricing_pack TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can view own campaigns"
  ON campaigns FOR SELECT USING (auth.uid() = brand_id);
CREATE POLICY "Brands can insert own campaigns"
  ON campaigns FOR INSERT WITH CHECK (auth.uid() = brand_id);
CREATE POLICY "Brands can update own campaigns"
  ON campaigns FOR UPDATE USING (auth.uid() = brand_id);
CREATE POLICY "Brands can delete draft campaigns"
  ON campaigns FOR DELETE USING (auth.uid() = brand_id AND status = 'draft');
CREATE POLICY "Authenticated users can view campaigns"
  ON campaigns FOR SELECT TO authenticated USING (true);

-- Constraints
ALTER TABLE campaigns ADD CONSTRAINT campaigns_title_length CHECK (char_length(title) <= 200);
ALTER TABLE campaigns ADD CONSTRAINT campaigns_budget_range CHECK (budget_chf >= 0 AND budget_chf <= 1000000);

-- ================================================
-- APPLICATIONS TABLE
-- ================================================

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pitch_message TEXT,
  proposed_rate_chf DECIMAL(10,2),
  status application_status DEFAULT 'pending' NOT NULL,
  -- Contract fields
  contract_status TEXT,
  contract_url TEXT,
  contract_generated_at TIMESTAMPTZ,
  brand_signed_at TIMESTAMPTZ,
  creator_signed_at TIMESTAMPTZ,
  brand_sign_ip TEXT,
  creator_sign_ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(campaign_id, creator_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own applications"
  ON applications FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Creators can insert applications"
  ON applications FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own applications"
  ON applications FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Brands can view campaign applications"
  ON applications FOR SELECT
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()));
CREATE POLICY "Brands can update application status"
  ON applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()));

-- Constraints
ALTER TABLE applications ADD CONSTRAINT applications_pitch_length CHECK (pitch_message IS NULL OR char_length(pitch_message) <= 2000);

-- ================================================
-- DELIVERABLES TABLE
-- ================================================

CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  video_duration_seconds INTEGER,
  thumbnail_url TEXT,
  is_watermarked BOOLEAN DEFAULT true,
  status deliverable_status DEFAULT 'pending' NOT NULL,
  revision_notes TEXT,
  rights_transferred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own deliverables"
  ON deliverables FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Creators can insert deliverables"
  ON deliverables FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own deliverables"
  ON deliverables FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Brands can view campaign deliverables"
  ON deliverables FOR SELECT
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()));
CREATE POLICY "Brands can update deliverable status"
  ON deliverables FOR UPDATE
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()));

-- ================================================
-- MESSAGES TABLE
-- ================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaign messages"
  ON messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM applications
      WHERE campaign_id = messages.campaign_id
      AND creator_id = auth.uid()
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can send campaign messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND (
      EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM applications
        WHERE campaign_id = messages.campaign_id
        AND creator_id = auth.uid()
        AND status = 'accepted'
      )
    )
  );

ALTER TABLE messages ADD CONSTRAINT messages_content_length CHECK (char_length(content) <= 5000);

-- ================================================
-- CONVERSATIONS TABLE
-- ================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(campaign_id, creator_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = brand_id);
CREATE POLICY "Users can insert conversations"
  ON conversations FOR INSERT WITH CHECK (auth.uid() = creator_id OR auth.uid() = brand_id);
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = brand_id);

-- ================================================
-- NOTIFICATIONS TABLE
-- ================================================

CREATE TABLE notifications (
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

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id != auth.uid());

ALTER TABLE notifications ADD CONSTRAINT notifications_message_length CHECK (message IS NULL OR char_length(message) <= 500);

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

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- MISSION STEPS TABLE (Agency workflow)
-- ================================================

CREATE TABLE mission_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  step_type mission_step_type NOT NULL,
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(campaign_id, step_type)
);

ALTER TABLE mission_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to mission_steps"
  ON mission_steps FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Brands can view own campaign steps"
  ON mission_steps FOR SELECT
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()));
CREATE POLICY "Creators can view assigned campaign steps"
  ON mission_steps FOR SELECT
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid()));

-- ================================================
-- BRAND REQUESTS TABLE (Landing page form)
-- ================================================

CREATE TABLE brand_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'meeting_scheduled', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE brand_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on brand_requests"
  ON brand_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Anyone can insert brand_requests"
  ON brand_requests FOR INSERT WITH CHECK (true);

-- ================================================
-- ADMIN ROLE
-- ================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- Admin RLS policies for all tables
CREATE POLICY "Admin full access to users"
  ON users FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to profiles_brand"
  ON profiles_brand FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to profiles_creator"
  ON profiles_creator FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to campaigns"
  ON campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to applications"
  ON applications FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to deliverables"
  ON deliverables FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to messages"
  ON messages FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to conversations"
  ON conversations FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin full access to notifications"
  ON notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ================================================
-- INDEXES
-- ================================================

CREATE INDEX idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_assigned_admin ON campaigns(assigned_admin_id);
CREATE INDEX idx_campaigns_selected_creator ON campaigns(selected_creator_id);
CREATE INDEX idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX idx_applications_creator_id ON applications(creator_id);
CREATE INDEX idx_applications_contract_status ON applications(contract_status);
CREATE INDEX idx_deliverables_campaign_id ON deliverables(campaign_id);
CREATE INDEX idx_messages_campaign_id ON messages(campaign_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_conversations_creator_id ON conversations(creator_id);
CREATE INDEX idx_conversations_brand_id ON conversations(brand_id);
CREATE INDEX idx_mission_steps_campaign ON mission_steps(campaign_id);
CREATE INDEX idx_brand_requests_status ON brand_requests(status);
CREATE INDEX idx_brand_requests_created ON brand_requests(created_at DESC);

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_brand_updated_at
  BEFORE UPDATE ON profiles_brand FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_creator_updated_at
  BEFORE UPDATE ON profiles_creator FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliverables_updated_at
  BEFORE UPDATE ON deliverables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mission_steps_updated_at
  BEFORE UPDATE ON mission_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- STORAGE RLS (for deliverables bucket)
-- ================================================

CREATE POLICY "Authenticated users can upload deliverables"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deliverables');
CREATE POLICY "Authenticated users can read deliverables"
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'deliverables');
CREATE POLICY "Authenticated users can update deliverables"
  ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'deliverables');
CREATE POLICY "Authenticated users can delete deliverables"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'deliverables');

-- ================================================
-- DONE! All tables, enums, policies, indexes created.
-- ================================================
