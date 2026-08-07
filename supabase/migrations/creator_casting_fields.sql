-- ============================================================
-- Creator casting attributes
--
-- What MOSH actually needs to match a creator to a brief: who they are,
-- where they can film, what they can film with.
--
-- Every field is optional and self-declared. Storing a birth year rather than
-- an age keeps the profile from silently going stale.
-- ============================================================

ALTER TABLE profiles_creator
  -- Demographics
  ADD COLUMN IF NOT EXISTS birth_year INTEGER,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS height_cm INTEGER,
  ADD COLUMN IF NOT EXISTS hair_color TEXT,
  ADD COLUMN IF NOT EXISTS eye_color TEXT,

  -- What they cover
  ADD COLUMN IF NOT EXISTS niches TEXT[] DEFAULT '{}',

  -- Where and how they shoot
  ADD COLUMN IF NOT EXISTS shoot_settings TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS equipment TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS can_travel BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_vehicle BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS does_voiceover BOOLEAN DEFAULT false,

  -- Context a brief sometimes requires (family products, pet food…)
  ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_pets BOOLEAN DEFAULT false;

-- Filtering on arrays is the main read pattern for casting.
CREATE INDEX IF NOT EXISTS idx_profiles_creator_niches ON profiles_creator USING GIN (niches);
CREATE INDEX IF NOT EXISTS idx_profiles_creator_settings ON profiles_creator USING GIN (shoot_settings);
