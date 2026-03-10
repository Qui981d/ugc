-- ================================================
-- Content-level Workflow Fields
-- Move per-video workflow fields to campaign_contents
-- ================================================

ALTER TABLE campaign_contents
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS script_content TEXT,
  ADD COLUMN IF NOT EXISTS script_status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mosh_qc_feedback TEXT,
  ADD COLUMN IF NOT EXISTS mosh_qc_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS brand_final_feedback TEXT,
  ADD COLUMN IF NOT EXISTS brand_final_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS brand_revision_count INTEGER DEFAULT 0;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_campaign_contents_status ON campaign_contents(status);
