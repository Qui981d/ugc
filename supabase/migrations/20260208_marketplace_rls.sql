-- ================================================
-- Allow any authenticated user to view creator profiles on the marketplace
-- Previously only brands and the creator themselves could read profiles_creator
-- ================================================

-- Allow any authenticated user to read creator profiles (for marketplace browsing)
CREATE POLICY "Authenticated users can view creator profiles"
  ON profiles_creator FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow any authenticated user to view basic user info (for marketplace)
-- Check if this policy doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Authenticated users can view all users'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view all users"
      ON users FOR SELECT
      USING (auth.uid() IS NOT NULL)';
  END IF;
END $$;
