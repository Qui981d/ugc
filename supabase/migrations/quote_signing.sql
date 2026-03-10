-- Quote/Devis signing fields on campaigns
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS quote_number TEXT,
  ADD COLUMN IF NOT EXISTS quote_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_signer_ip TEXT;
