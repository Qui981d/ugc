-- ================================================
-- Add contract columns to campaigns table
-- Run this in Supabase SQL Editor
-- ================================================

-- Contract MOSH ↔ Creator columns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contract_mosh_url TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contract_mosh_status TEXT DEFAULT NULL;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contract_mosh_generated_at TIMESTAMPTZ;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contract_mosh_signed_at TIMESTAMPTZ;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS creator_amount_chf NUMERIC;

-- Brand final review columns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brand_final_feedback TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brand_final_approved_at TIMESTAMPTZ;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brand_revision_count INTEGER DEFAULT 0;

-- Script brand review columns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS script_brand_feedback TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS script_brand_approved_at TIMESTAMPTZ;

-- Brief feedback columns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brief_feedback_notes TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brief_feedback_at TIMESTAMPTZ;

-- Brand profile selection columns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brand_profile_selection_at TIMESTAMPTZ;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brand_profile_rejection_reason TEXT;

-- Invoice columns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS invoice_url TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Storage bucket for contracts (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: allow authenticated users to upload/read contracts
DROP POLICY IF EXISTS "Authenticated users can upload contracts" ON storage.objects;
CREATE POLICY "Authenticated users can upload contracts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contracts');

DROP POLICY IF EXISTS "Authenticated users can read contracts" ON storage.objects;
CREATE POLICY "Authenticated users can read contracts"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contracts');

DROP POLICY IF EXISTS "Authenticated users can update contracts" ON storage.objects;
CREATE POLICY "Authenticated users can update contracts"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'contracts');
