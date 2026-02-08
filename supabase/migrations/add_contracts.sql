-- ================================================
-- CONTRACT SYSTEM - Add contract fields to applications
-- ================================================

-- Contract tracking on applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS contract_status TEXT DEFAULT NULL;
-- Values: NULL (no contract), 'pending_creator', 'active', 'cancelled'

ALTER TABLE applications ADD COLUMN IF NOT EXISTS contract_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS contract_generated_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS brand_signed_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS creator_signed_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS brand_sign_ip TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS creator_sign_ip TEXT;

-- Optional address fields on profiles (for contract generation)
ALTER TABLE profiles_brand ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles_creator ADD COLUMN IF NOT EXISTS address TEXT;

-- Index for quick contract lookups
CREATE INDEX IF NOT EXISTS idx_applications_contract_status ON applications(contract_status);
