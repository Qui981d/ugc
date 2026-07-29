-- ============================================================
-- ClickUp integration
-- Links a mission to its ClickUp card + subtasks so the app can
-- create the card on mission creation and tick subtasks as steps
-- are validated.
-- ============================================================

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS clickup_list_id TEXT,     -- destination ClickUp list (client)
  ADD COLUMN IF NOT EXISTS clickup_task_id TEXT,     -- the created parent card id
  ADD COLUMN IF NOT EXISTS clickup_subtask_map JSONB; -- { "Brief": "<id>", "Recherche UGC": "<id>", ... }
