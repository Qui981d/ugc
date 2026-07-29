-- ============================================================
-- Internal MOSH missions
-- Lets MOSH create a mission directly (brand_id = MOSH admin) and
-- track an internal client name, shooting/delivery dates (with a
-- "fixed date" flag each), and a creator price negotiation.
-- ============================================================

ALTER TABLE campaigns
  -- Internal client (free text; the real brand_id stays = MOSH admin)
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  -- Shooting date + whether it is a fixed (imposed) date
  ADD COLUMN IF NOT EXISTS shooting_date DATE,
  ADD COLUMN IF NOT EXISTS shooting_date_fixed BOOLEAN DEFAULT false,
  -- Whether the delivery date (deadline) is fixed (imposed)
  ADD COLUMN IF NOT EXISTS delivery_date_fixed BOOLEAN DEFAULT false,
  -- Price negotiation: MOSH proposes creator_amount_chf; the creator may
  -- counter with a higher price at proposal time (step 1b).
  ADD COLUMN IF NOT EXISTS creator_counter_amount_chf NUMERIC,
  -- 'proposed' (MOSH offered) | 'counter' (creator asked more) | 'accepted'
  ADD COLUMN IF NOT EXISTS creator_price_status TEXT,
  -- Optional message the creator attaches to a price counter-offer
  ADD COLUMN IF NOT EXISTS creator_price_message TEXT;
