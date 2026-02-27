-- Migration: Add video production/delivery columns to campaigns
-- Run this in Supabase SQL Editor

-- Video delivery columns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS video_uploaded_at TIMESTAMPTZ;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS mosh_qc_feedback TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS mosh_qc_approved_at TIMESTAMPTZ;

-- Storage bucket for videos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for videos bucket
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'videos');

DROP POLICY IF EXISTS "Authenticated users can read videos" ON storage.objects;
CREATE POLICY "Authenticated users can read videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Authenticated users can update videos" ON storage.objects;
CREATE POLICY "Authenticated users can update videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "Authenticated users can delete videos" ON storage.objects;
CREATE POLICY "Authenticated users can delete videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'videos');
