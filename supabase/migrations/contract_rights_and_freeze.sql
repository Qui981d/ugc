-- ============================================================
-- Rights per mission, and contracts that stop moving once signed
--
-- Two problems this fixes.
--
-- 1. Nothing recorded what the client may do with a video. The contract
--    granted a full, unlimited assignment; the platform showed nothing at all.
--
-- 2. The signed contract was regenerated from live campaign data every time
--    it was opened. Edit the campaign after signature and the "contract" both
--    parties agreed to quietly changed. The text is now frozen at signature,
--    with a hash and the signing IP the document already claimed to record.
-- ============================================================

ALTER TABLE campaigns
  -- What the client bought. Defaults are applied in code, not here, so the
  -- shape stays in one place.
  ADD COLUMN IF NOT EXISTS rights JSONB,

  -- The contract exactly as accepted.
  ADD COLUMN IF NOT EXISTS contract_mosh_text TEXT,
  ADD COLUMN IF NOT EXISTS contract_mosh_hash TEXT,
  ADD COLUMN IF NOT EXISTS contract_mosh_signed_ip TEXT;

-- Per-video missions carry their own contract.
ALTER TABLE campaign_contents
  ADD COLUMN IF NOT EXISTS contract_text TEXT,
  ADD COLUMN IF NOT EXISTS contract_hash TEXT,
  ADD COLUMN IF NOT EXISTS contract_signed_ip TEXT;

-- Paid media runs for six months from the first ad, so that date has to be
-- recorded somewhere. Without it the window can never be computed.
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS paid_media_activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_media_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_campaigns_paid_expiry
  ON campaigns (paid_media_expires_at)
  WHERE paid_media_expires_at IS NOT NULL;
