-- ================================================
-- Campaign Multi-Video Redesign
-- Add campaign_contents table for individual video blocks
-- Add brief_image_urls and creator_preference to campaigns
-- ================================================

-- 1. New table for video/content blocks
CREATE TABLE campaign_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL DEFAULT 'video',
  format TEXT NOT NULL DEFAULT '9_16',
  script_type TEXT NOT NULL DEFAULT 'testimonial',
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_campaign_contents_campaign_id ON campaign_contents(campaign_id);

-- 2. RLS
ALTER TABLE campaign_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand can manage own campaign contents" ON campaign_contents FOR ALL
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND brand_id = auth.uid()));

CREATE POLICY "Admin full access campaign contents" ON campaign_contents FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Creator can view assigned campaign contents" ON campaign_contents FOR SELECT
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND selected_creator_id = auth.uid()));

-- 3. New columns on campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS brief_image_urls TEXT[] DEFAULT '{}';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS creator_preference TEXT DEFAULT 'single';

-- 4. Migrate existing thumbnail data
UPDATE campaigns SET brief_image_urls = ARRAY[thumbnail_url] WHERE thumbnail_url IS NOT NULL;

-- 5. Drop old column
ALTER TABLE campaigns DROP COLUMN IF EXISTS thumbnail_url;
