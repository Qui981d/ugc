-- ============================================================
-- Migration: Brand Workflow Fields & Extended Enums
-- Adds bidirectional feedback loop support for Brand ↔ MOSH ↔ Creator
-- ============================================================

-- 1. Extend mission_step_type enum with new workflow steps
ALTER TYPE mission_step_type ADD VALUE IF NOT EXISTS 'brief_feedback';
ALTER TYPE mission_step_type ADD VALUE IF NOT EXISTS 'brand_reviewing_profiles';
ALTER TYPE mission_step_type ADD VALUE IF NOT EXISTS 'script_brand_review';
ALTER TYPE mission_step_type ADD VALUE IF NOT EXISTS 'script_brand_approved';
ALTER TYPE mission_step_type ADD VALUE IF NOT EXISTS 'brand_final_review';
ALTER TYPE mission_step_type ADD VALUE IF NOT EXISTS 'brand_final_approved';

-- 2. Extend script_status enum with brand review states
ALTER TYPE script_status ADD VALUE IF NOT EXISTS 'brand_review';
ALTER TYPE script_status ADD VALUE IF NOT EXISTS 'brand_approved';

-- 3. Add brand workflow columns to campaigns table
ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS brief_feedback_notes TEXT,
    ADD COLUMN IF NOT EXISTS brief_feedback_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS proposed_creator_ids UUID[] DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS brand_profile_selection_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS brand_profile_rejection_reason TEXT,
    ADD COLUMN IF NOT EXISTS script_brand_feedback TEXT,
    ADD COLUMN IF NOT EXISTS script_brand_approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS brand_final_feedback TEXT,
    ADD COLUMN IF NOT EXISTS brand_final_approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS brand_revision_count INTEGER DEFAULT 0;
