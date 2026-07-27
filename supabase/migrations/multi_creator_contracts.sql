-- ================================================
-- Multi-Creator Contract Support
-- Add per-content contract fields for per_video campaigns
-- ================================================

ALTER TABLE campaign_contents
  ADD COLUMN IF NOT EXISTS creator_amount_chf NUMERIC,
  ADD COLUMN IF NOT EXISTS contract_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contract_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_url TEXT,
  -- Per-creator invoicing (generateInvoiceForCreator writes these on campaign_contents)
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS invoice_generated_at TIMESTAMPTZ;

-- Also ensure brief_brand_response exists on campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brief_brand_response TEXT;
