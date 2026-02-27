-- Migration: Add missing values to mission_step_type enum
-- These values are used by the pipeline but were never added to the PostgreSQL enum

-- Add each missing value individually (ALTER TYPE ... ADD VALUE is safe, it's a no-op if value exists in PG 12+)
DO $$
BEGIN
    -- Check and add each value that might be missing
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'brief_feedback' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mission_step_type')) THEN
        ALTER TYPE mission_step_type ADD VALUE 'brief_feedback';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'brand_reviewing_profiles' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mission_step_type')) THEN
        ALTER TYPE mission_step_type ADD VALUE 'brand_reviewing_profiles';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'script_brand_review' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mission_step_type')) THEN
        ALTER TYPE mission_step_type ADD VALUE 'script_brand_review';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'script_brand_approved' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mission_step_type')) THEN
        ALTER TYPE mission_step_type ADD VALUE 'script_brand_approved';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'mission_sent_to_creator' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mission_step_type')) THEN
        ALTER TYPE mission_step_type ADD VALUE 'mission_sent_to_creator';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'contract_signed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mission_step_type')) THEN
        ALTER TYPE mission_step_type ADD VALUE 'contract_signed';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'creator_accepted' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mission_step_type')) THEN
        ALTER TYPE mission_step_type ADD VALUE 'creator_accepted';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'creator_shooting' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mission_step_type')) THEN
        ALTER TYPE mission_step_type ADD VALUE 'creator_shooting';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'video_uploaded_by_creator' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mission_step_type')) THEN
        ALTER TYPE mission_step_type ADD VALUE 'video_uploaded_by_creator';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'video_delivered' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mission_step_type')) THEN
        ALTER TYPE mission_step_type ADD VALUE 'video_delivered';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'video_validated' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mission_step_type')) THEN
        ALTER TYPE mission_step_type ADD VALUE 'video_validated';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'video_sent_to_brand' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mission_step_type')) THEN
        ALTER TYPE mission_step_type ADD VALUE 'video_sent_to_brand';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'brand_final_review' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mission_step_type')) THEN
        ALTER TYPE mission_step_type ADD VALUE 'brand_final_review';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'brand_final_approved' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'mission_step_type')) THEN
        ALTER TYPE mission_step_type ADD VALUE 'brand_final_approved';
    END IF;
END $$;

-- Also ensure unique constraint exists for upsert to work
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'mission_steps_campaign_id_step_type_key'
    ) THEN
        ALTER TABLE mission_steps ADD CONSTRAINT mission_steps_campaign_id_step_type_key UNIQUE (campaign_id, step_type);
    END IF;
END $$;
