-- ============================================================================
--  DevTrails Core Migration 004
--  Relax legacy claims constraints for new claim ingestion flow
--  Safe to run multiple times (idempotent)
-- ============================================================================

BEGIN;

ALTER TABLE IF EXISTS public.claims
    ALTER COLUMN policy_id DROP NOT NULL,
    ALTER COLUMN claim_hash DROP NOT NULL,
    ALTER COLUMN trigger_event DROP NOT NULL,
    ALTER COLUMN amount_claimed DROP NOT NULL;

COMMIT;
