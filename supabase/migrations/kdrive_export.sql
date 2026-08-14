-- ============================================================
-- Export delivered videos to the client's kDrive folder
--
-- The folder is set per client, the same way the ClickUp list already is, so
-- MOSH configures it once on the brand page instead of choosing at export time.
--
-- The export result is stored rather than fired and forgotten: this codebase
-- has repeatedly shipped silent failures, and an export nobody can see the
-- state of is one nobody can retry.
-- ============================================================

ALTER TABLE profiles_brand
  -- A path as typed in kDrive, e.g. "/Clients/La Combe". Not an id — MOSH can
  -- read a path off the interface, an id has to be dug out of a URL.
  ADD COLUMN IF NOT EXISTS kdrive_folder_path TEXT;

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS kdrive_exported_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kdrive_file_path TEXT,
  ADD COLUMN IF NOT EXISTS kdrive_export_error TEXT;

-- Per-video missions each deliver their own file.
ALTER TABLE campaign_contents
  ADD COLUMN IF NOT EXISTS kdrive_exported_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kdrive_file_path TEXT,
  ADD COLUMN IF NOT EXISTS kdrive_export_error TEXT;
