-- ============================================================================
--  DevTrails Core — PostgreSQL Initial Schema
--  Database: devtrails_core
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
--  ENUM Types
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE policy_status  AS ENUM ('active', 'expired', 'cancelled', 'pending');
CREATE TYPE claim_status   AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'paid');
CREATE TYPE trigger_type   AS ENUM ('weather', 'traffic', 'accident', 'earthquake');

-- ─────────────────────────────────────────────────────────────────────────────
--  Gig Workers (Policyholders)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gig_workers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    platform        VARCHAR(100),              -- e.g., Uber, DoorDash, Instacart
    city            VARCHAR(100),
    state           VARCHAR(50),
    zip_code        VARCHAR(10),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  Parametric Insurance Policies
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS policies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id       UUID NOT NULL REFERENCES gig_workers(id) ON DELETE CASCADE,
    policy_number   VARCHAR(50) UNIQUE NOT NULL,
    trigger         trigger_type NOT NULL,
    threshold_value NUMERIC(10, 2) NOT NULL,    -- e.g., wind speed > 60 mph
    coverage_amount NUMERIC(12, 2) NOT NULL,
    premium_monthly NUMERIC(8, 2) NOT NULL,
    status          policy_status DEFAULT 'pending',
    effective_date  DATE NOT NULL,
    expiry_date     DATE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  Claims
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS claims (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id       UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    claim_hash      VARCHAR(64) UNIQUE NOT NULL,   -- SHA-256 for Redis dedup
    trigger_event   JSONB NOT NULL,                 -- Raw event payload
    amount_claimed  NUMERIC(12, 2) NOT NULL,
    amount_approved NUMERIC(12, 2),
    status          claim_status DEFAULT 'submitted',
    fraud_score     NUMERIC(5, 4),                  -- 0.0000 to 1.0000
    submitted_at    TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ,
    paid_at         TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────────────────────
--  Parametric Trigger Events (Audit Log)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trigger_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type      trigger_type NOT NULL,
    location        VARCHAR(255),
    coordinates     POINT,
    measured_value  NUMERIC(10, 2) NOT NULL,
    threshold       NUMERIC(10, 2) NOT NULL,
    triggered       BOOLEAN DEFAULT FALSE,
    raw_payload     JSONB,
    source          VARCHAR(100),               -- API source identifier
    recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
--  Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_policies_worker         ON policies (worker_id);
CREATE INDEX idx_policies_status         ON policies (status);
CREATE INDEX idx_claims_policy           ON claims (policy_id);
CREATE INDEX idx_claims_status           ON claims (status);
CREATE INDEX idx_claims_hash             ON claims (claim_hash);
CREATE INDEX idx_trigger_events_type     ON trigger_events (event_type);
CREATE INDEX idx_trigger_events_recorded ON trigger_events (recorded_at);
