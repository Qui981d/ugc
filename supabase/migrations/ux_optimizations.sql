-- Migration: Add columns for brand settings persistence and campaign thumbnails
-- Covers: B1 (settings persistence), B10 (notification prefs), B3 (thumbnail)

-- profiles_brand: additional fields for settings page
ALTER TABLE profiles_brand ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE profiles_brand ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"emailNewApplicant":true,"emailMessages":true,"emailCampaignEnd":true,"emailInvoice":true,"emailMarketing":false}'::jsonb;

-- campaigns: thumbnail URL for brand brief covers
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- campaigns: admin internal notes
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS admin_notes TEXT;
