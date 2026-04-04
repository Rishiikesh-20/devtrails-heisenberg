-- ============================================================================
--  DevTrails Core Migration 002
--  Add backend claim routing fields to claims table
--  Safe to run multiple times (idempotent)
-- ============================================================================

BEGIN;

ALTER TABLE IF EXISTS public.claims
    ADD COLUMN IF NOT EXISTS event_id TEXT,
    ADD COLUMN IF NOT EXISTS user_id TEXT,
    ADD COLUMN IF NOT EXISTS frs_score FLOAT,
    ADD COLUMN IF NOT EXISTS decision TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

COMMIT;
