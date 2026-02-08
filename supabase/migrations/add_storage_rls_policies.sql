-- ================================================
-- Storage RLS Policies for 'deliverables' bucket
-- Run this in Supabase SQL Editor
-- ================================================

-- Allow authenticated users to upload files to the deliverables bucket
CREATE POLICY "Authenticated users can upload deliverables"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'deliverables');

-- Allow authenticated users to read deliverables
CREATE POLICY "Authenticated users can read deliverables"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'deliverables');

-- Allow authenticated users to update their deliverables
CREATE POLICY "Authenticated users can update deliverables"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'deliverables');

-- Allow authenticated users to delete their deliverables
CREATE POLICY "Authenticated users can delete deliverables"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'deliverables');
