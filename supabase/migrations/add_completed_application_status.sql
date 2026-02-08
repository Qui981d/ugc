-- ================================================
-- Add 'completed' to application_status enum
-- Run this in Supabase SQL Editor
-- ================================================

ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'completed';
