-- ================================================
-- ADMIN ACCOUNT SETUP
-- Run this in Supabase SQL Editor AFTER creating
-- the admin user via Supabase Auth (email + password)
-- ================================================

-- 1. Ensure 'admin' role exists in the enum
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Insert admin user record
-- IMPORTANT: Replace the values below with your actual admin user info
-- The UUID must match the auth.users id from Supabase Auth
-- You can find it in Authentication > Users table

-- INSERT INTO users (id, email, full_name, role)
-- VALUES (
--   'YOUR-AUTH-USER-UUID-HERE',
--   'your-admin-email@example.com',
--   'Admin MOSH',
--   'admin'
-- );

-- OR if the user already exists (e.g., signed up as brand/creator):
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';

-- 3. Ensure RLS policies allow admin access
-- (These should already exist from FULL_SETUP.sql)
CREATE POLICY IF NOT EXISTS "Authenticated users can view campaigns"
  ON campaigns FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Admin full access to campaigns"
  ON campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- 4. Verify
-- SELECT id, email, role FROM users WHERE role = 'admin';
