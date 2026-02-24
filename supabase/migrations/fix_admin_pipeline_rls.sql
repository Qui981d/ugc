-- ================================================
-- FIX: Ensure admin can see ALL campaigns in Pipeline
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. Add 'admin' to user_role enum if not already present
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Drop any conflicting policies and recreate clean ones
DROP POLICY IF EXISTS "Admin full access to campaigns" ON campaigns;
DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON campaigns;

-- 3. All authenticated users can view all campaigns (SELECT)
CREATE POLICY "Authenticated users can view campaigns"
  ON campaigns FOR SELECT TO authenticated USING (true);

-- 4. Admin full CRUD access to campaigns
CREATE POLICY "Admin full access to campaigns"
  ON campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 5. Admin full access to mission_steps
DROP POLICY IF EXISTS "Admin full access to mission_steps" ON mission_steps;
CREATE POLICY "Admin full access to mission_steps"
  ON mission_steps FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 6. Admin full access to all other tables
DROP POLICY IF EXISTS "Admin full access to users" ON users;
CREATE POLICY "Admin full access to users"
  ON users FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin full access to profiles_brand" ON profiles_brand;
CREATE POLICY "Admin full access to profiles_brand"
  ON profiles_brand FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin full access to profiles_creator" ON profiles_creator;
CREATE POLICY "Admin full access to profiles_creator"
  ON profiles_creator FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin full access to applications" ON applications;
CREATE POLICY "Admin full access to applications"
  ON applications FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin full access to deliverables" ON deliverables;
CREATE POLICY "Admin full access to deliverables"
  ON deliverables FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin full access to messages" ON messages;
CREATE POLICY "Admin full access to messages"
  ON messages FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin full access to conversations" ON conversations;
CREATE POLICY "Admin full access to conversations"
  ON conversations FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin full access to notifications" ON notifications;
CREATE POLICY "Admin full access to notifications"
  ON notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 7. Verify: check your admin user's role
-- Replace 'your-admin-email@example.com' with your admin email
-- SELECT id, email, role FROM users WHERE email = 'your-admin-email@example.com';
-- If role is NOT 'admin', run:
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
