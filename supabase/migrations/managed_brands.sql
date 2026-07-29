-- ============================================================
-- Managed brands (agency model)
-- MOSH creates real brand accounts it operates on behalf of.
-- is_managed distinguishes them from self-serve brands; clickup_list_id
-- stores the brand's default ClickUp list so missions land there.
-- ============================================================

ALTER TABLE profiles_brand
  ADD COLUMN IF NOT EXISTS is_managed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS clickup_list_id TEXT;
