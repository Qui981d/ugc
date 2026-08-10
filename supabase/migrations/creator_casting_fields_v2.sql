-- ============================================================
-- Creator casting attributes, second pass
--
-- What the first pass missed: how experienced they are, how fast they
-- deliver, what they will not film, and where to see their work.
--
-- Note: location_canton and hourly_rate_chf already exist on this table but
-- were never asked at signup — only wired into the form, no column needed.
-- ============================================================

ALTER TABLE profiles_creator
  -- How they work
  ADD COLUMN IF NOT EXISTS experience_level TEXT,
  ADD COLUMN IF NOT EXISTS delivery_delay_days INTEGER,

  -- Appearance a brief sometimes specifies
  ADD COLUMN IF NOT EXISTS skin_tone TEXT,
  ADD COLUMN IF NOT EXISTS has_visible_tattoos BOOLEAN DEFAULT false,

  -- Where their work lives
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_handle TEXT,
  ADD COLUMN IF NOT EXISTS follower_range TEXT,

  -- Subjects they decline — cheaper to know now than after a brief is written
  ADD COLUMN IF NOT EXISTS excluded_topics TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_profiles_creator_experience ON profiles_creator (experience_level);
