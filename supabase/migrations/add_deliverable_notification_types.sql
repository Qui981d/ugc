-- ================================================
-- Add missing notification_type enum values
-- Run this in Supabase SQL Editor
-- ================================================

-- Add deliverable review notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'deliverable_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'deliverable_revision';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'deliverable_rejected';
