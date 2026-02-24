-- ================================================
-- NUCLEAR RLS RESET — COMPLETE DATABASE FIX
-- Replaces ALL 28 migration scripts.
-- Run this ONCE in Supabase SQL Editor.
-- ================================================

-- ============================================================
-- STEP 1: ENUMS (must exist before tables)
-- ============================================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'deliverable_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'deliverable_revision';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'deliverable_rejected';

DO $$ BEGIN CREATE TYPE mission_step_type AS ENUM ('brief_received','creators_proposed','creator_validated','script_sent','video_delivered','video_validated','video_sent_to_brand'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE script_status AS ENUM ('draft','pending_validation','validated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- STEP 2: TABLES (must exist before policies)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(campaign_id, creator_id)
);

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

CREATE TABLE IF NOT EXISTS mission_steps (
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

CREATE TABLE IF NOT EXISTS brand_requests (
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

-- ============================================================
-- STEP 3: COLUMNS (IF NOT EXISTS — safe to re-run)
-- ============================================================
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES users(id);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS selected_creator_id UUID REFERENCES users(id);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS script_content TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS script_status TEXT DEFAULT 'draft';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS pricing_pack TEXT;

ALTER TABLE applications ADD COLUMN IF NOT EXISTS contract_status TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS contract_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS contract_generated_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS brand_signed_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS creator_signed_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS brand_sign_ip TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS creator_sign_ip TEXT;

ALTER TABLE profiles_brand ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles_creator ADD COLUMN IF NOT EXISTS address TEXT;

-- ============================================================
-- STEP 4: is_admin() SECURITY DEFINER (avoids RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- STEP 5: ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles_brand ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles_creator ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: DROP ALL POLICIES ON EVERY TABLE
-- ============================================================
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname); END LOOP; END $$;

DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles_brand' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles_brand', r.policyname); END LOOP; END $$;

DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles_creator' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles_creator', r.policyname); END LOOP; END $$;

DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'campaigns' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.campaigns', r.policyname); END LOOP; END $$;

DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'applications' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.applications', r.policyname); END LOOP; END $$;

DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'deliverables' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.deliverables', r.policyname); END LOOP; END $$;

DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.messages', r.policyname); END LOOP; END $$;

DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'conversations' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.conversations', r.policyname); END LOOP; END $$;

DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', r.policyname); END LOOP; END $$;

DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'notification_preferences' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.notification_preferences', r.policyname); END LOOP; END $$;

DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'mission_steps' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.mission_steps', r.policyname); END LOOP; END $$;

DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'brand_requests' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.brand_requests', r.policyname); END LOOP; END $$;

-- Storage policies
DROP POLICY IF EXISTS "Authenticated users can upload deliverables" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read deliverables" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update deliverables" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete deliverables" ON storage.objects;

-- ============================================================
-- STEP 7: RECREATE ALL POLICIES — CLEAN
-- ============================================================

-- ==================== USERS ====================
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin full access to users"
  ON users FOR ALL USING (public.is_admin());

-- ==================== PROFILES_BRAND ====================
CREATE POLICY "Brands can view own profile"
  ON profiles_brand FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Brands can update own profile"
  ON profiles_brand FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Brands can insert own profile"
  ON profiles_brand FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators can view brand profiles"
  ON profiles_brand FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'creator'));
CREATE POLICY "Admin full access to profiles_brand"
  ON profiles_brand FOR ALL USING (public.is_admin());

-- ==================== PROFILES_CREATOR ====================
CREATE POLICY "Creators can view own profile"
  ON profiles_creator FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Creators can update own profile"
  ON profiles_creator FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Creators can insert own profile"
  ON profiles_creator FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view creator profiles"
  ON profiles_creator FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin full access to profiles_creator"
  ON profiles_creator FOR ALL USING (public.is_admin());

-- ==================== CAMPAIGNS ====================
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
CREATE POLICY "Admin full access to campaigns"
  ON campaigns FOR ALL USING (public.is_admin());

-- ==================== APPLICATIONS ====================
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
CREATE POLICY "Admin full access to applications"
  ON applications FOR ALL USING (public.is_admin());

-- ==================== DELIVERABLES ====================
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
CREATE POLICY "Admin full access to deliverables"
  ON deliverables FOR ALL USING (public.is_admin());

-- ==================== MESSAGES ====================
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
CREATE POLICY "Admin full access to messages"
  ON messages FOR ALL USING (public.is_admin());

-- ==================== CONVERSATIONS ====================
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = creator_id OR auth.uid() = brand_id);
CREATE POLICY "Users can insert conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = creator_id OR auth.uid() = brand_id);
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() = brand_id);
CREATE POLICY "Admin full access to conversations"
  ON conversations FOR ALL USING (public.is_admin());

-- ==================== NOTIFICATIONS ====================
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id != auth.uid());
CREATE POLICY "Admin full access to notifications"
  ON notifications FOR ALL USING (public.is_admin());

-- ==================== NOTIFICATION_PREFERENCES ====================
CREATE POLICY "Users can manage own preferences"
  ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- ==================== MISSION_STEPS ====================
CREATE POLICY "Admin full access to mission_steps"
  ON mission_steps FOR ALL USING (public.is_admin());
CREATE POLICY "Brands can view own campaign steps"
  ON mission_steps FOR SELECT
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()));
CREATE POLICY "Creators can view assigned campaign steps"
  ON mission_steps FOR SELECT
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid()));

-- ==================== BRAND_REQUESTS ====================
CREATE POLICY "Admin full access on brand_requests"
  ON brand_requests FOR ALL
  USING (public.is_admin());
CREATE POLICY "Anyone can insert brand_requests"
  ON brand_requests FOR INSERT WITH CHECK (true);

-- ==================== STORAGE ====================
CREATE POLICY "Authenticated users can upload deliverables"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deliverables');
CREATE POLICY "Authenticated users can read deliverables"
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'deliverables');
CREATE POLICY "Authenticated users can update deliverables"
  ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'deliverables');
CREATE POLICY "Authenticated users can delete deliverables"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'deliverables');

-- ============================================================
-- STEP 8: INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_assigned_admin ON campaigns(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_selected_creator ON campaigns(selected_creator_id);
CREATE INDEX IF NOT EXISTS idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_applications_creator_id ON applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_applications_contract_status ON applications(contract_status);
CREATE INDEX IF NOT EXISTS idx_deliverables_campaign_id ON deliverables(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_conversations_creator_id ON conversations(creator_id);
CREATE INDEX IF NOT EXISTS idx_conversations_brand_id ON conversations(brand_id);
CREATE INDEX IF NOT EXISTS idx_mission_steps_campaign ON mission_steps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_brand_requests_status ON brand_requests(status);
CREATE INDEX IF NOT EXISTS idx_brand_requests_created ON brand_requests(created_at DESC);

-- ============================================================
-- STEP 9: CONSTRAINTS
-- ============================================================
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_content_length;
ALTER TABLE messages ADD CONSTRAINT messages_content_length CHECK (char_length(content) <= 5000);
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_title_length;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_title_length CHECK (char_length(title) <= 200);
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_budget_range;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_budget_range CHECK (budget_chf >= 0 AND budget_chf <= 1000000);
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_pitch_length;
ALTER TABLE applications ADD CONSTRAINT applications_pitch_length CHECK (pitch_message IS NULL OR char_length(pitch_message) <= 2000);
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_message_length;
ALTER TABLE notifications ADD CONSTRAINT notifications_message_length CHECK (message IS NULL OR char_length(message) <= 500);

-- ============================================================
-- STEP 10: FUNCTIONS & TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_profiles_brand_updated_at ON profiles_brand;
CREATE TRIGGER update_profiles_brand_updated_at BEFORE UPDATE ON profiles_brand FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_profiles_creator_updated_at ON profiles_creator;
CREATE TRIGGER update_profiles_creator_updated_at BEFORE UPDATE ON profiles_creator FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_deliverables_updated_at ON deliverables;
CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON deliverables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_mission_steps_updated_at ON mission_steps;
CREATE TRIGGER update_mission_steps_updated_at BEFORE UPDATE ON mission_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'creator')::user_role
  );

  IF NEW.raw_user_meta_data->>'role' = 'brand' THEN
    INSERT INTO profiles_brand (user_id, company_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Company'));
  ELSE
    INSERT INTO profiles_creator (user_id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DONE. Covers EVERYTHING from all 28 migrations.
-- ============================================================
