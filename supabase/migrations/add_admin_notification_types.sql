-- ================================================
-- Add admin workflow notification types (if needed in future)
-- Currently we reuse existing types to avoid migration issues
-- ================================================

-- These are future-proofing additions.
-- The admin workflow currently reuses:
--   'new_application'        for creator proposals + brand assignments
--   'application_accepted'   for creator assignments + brief/script validation  
--   'deliverable_submitted'  for video ready notifications

-- Uncomment below if you want dedicated types:
-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'brief_validated';
-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'creator_assigned';
-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'script_validated';
-- ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'mission_completed';

-- Ensure RLS allows admins to insert notifications for any user
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Admin can insert notifications'
        AND tablename = 'notifications'
    ) THEN
        EXECUTE 'CREATE POLICY "Admin can insert notifications" ON notifications FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = ''admin'')
        )';
    END IF;
END $$;
