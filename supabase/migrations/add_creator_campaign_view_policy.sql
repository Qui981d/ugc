-- ================================================
-- FIX: RLS policies for campaigns and users tables
-- 
-- Problem: Creators could only view 'open' campaigns,
-- which broke all joins once a campaign changed status.
-- This also broke the missions list and mission detail pages.
-- ================================================

-- 1. Remove the restrictive creator campaign policy  
DROP POLICY IF EXISTS "Creators can view open campaigns" ON campaigns;

-- 2. Remove our previous fix attempt (if applied)
DROP POLICY IF EXISTS "Creators can view applied campaigns" ON campaigns;

-- 3. Allow ALL authenticated users to view ALL campaigns
-- This is correct for a marketplace: campaigns should be readable
CREATE POLICY "Authenticated users can view campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (true);

-- 4. Ensure users table allows reading basic info (names, avatars)
-- Needed for displaying brand/creator names in joins
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Authenticated users can view basic user info'
    ) THEN
        CREATE POLICY "Authenticated users can view basic user info"
          ON users FOR SELECT
          TO authenticated
          USING (true);
    END IF;
END $$;
