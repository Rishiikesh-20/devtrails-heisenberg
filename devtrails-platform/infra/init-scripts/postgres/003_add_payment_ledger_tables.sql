-- ============================================================================
--  DevTrails Core Migration 003
--  Add wage, payout transaction, and ledger accounting tables
--  Safe to run multiple times (idempotent)
-- ============================================================================

BEGIN;

ALTER TABLE IF EXISTS public.users
    ADD COLUMN IF NOT EXISTS wage_per_hour DOUBLE PRECISION NOT NULL DEFAULT 150;

CREATE TABLE IF NOT EXISTS public.ledgers (
    user_id     TEXT PRIMARY KEY,
    balance     NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payout_transactions (
    id                        TEXT PRIMARY KEY,
    user_id                   TEXT NOT NULL,
    event_id                  TEXT NOT NULL,
    claim_id                  TEXT NOT NULL,
    amount                    NUMERIC(14, 2) NOT NULL,
    currency                  TEXT NOT NULL DEFAULT 'inr',
    stripe_payment_intent_id  TEXT,
    stripe_status             TEXT NOT NULL,
    status                    TEXT NOT NULL,
    error_message             TEXT,
    idempotency_key           TEXT NOT NULL UNIQUE,
    processed_at              TIMESTAMPTZ,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id                     TEXT PRIMARY KEY,
    payout_transaction_id  TEXT NOT NULL UNIQUE REFERENCES public.payout_transactions(id) ON DELETE CASCADE,
    user_id                TEXT NOT NULL,
    event_id               TEXT NOT NULL,
    amount                 NUMERIC(14, 2) NOT NULL,
    entry_type             TEXT NOT NULL,
    source                 TEXT NOT NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_transactions_user_id ON public.payout_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_event_id ON public.payout_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_status ON public.payout_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payout_transactions_stripe_payment_intent_id ON public.payout_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_user_id ON public.ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_event_id ON public.ledger_entries(event_id);

COMMIT;
