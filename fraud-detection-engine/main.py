"""
AI & Fraud Prevention Engine — FRS (Fraud Risk Score) Microservice
==================================================================
A FastAPI microservice implementing a 4-gate fraud detection pipeline
for parametric income protection claims.

Architecture:
  Gate 1 — The Bouncer:    Rule-based filters (duplicate claims, policy age)
  Gate 2 — Speed Camera:   GPS velocity anomaly detection
  Gate 3 — Outlier Detector: Earnings inflation + activity gaming
  Gate 4 — Network Mapper: Group collusion detection

Run:
  uvicorn main:app --reload --port 8000
  Open http://localhost:8000/docs for interactive Swagger UI
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from models.schemas import (
    ClaimRequest, FRSResult, GateResult,
    FRSDecision, EventType
)
from gates.gate1_bouncer import run_gate1, clear_claim_store, get_claim_store_size
from config import (
    AUTO_APPROVE_MAX, PARTIAL_HOLD_MAX, FRS_MAX_SCORE,
    DECISION_AUTO_APPROVE, DECISION_PARTIAL_HOLD, DECISION_FULL_WITHHOLD,
    ZONE_ANOMALY_BONUS
)

# ─── App Setup ───────────────────────────────────────────────────────

app = FastAPI(
    title="🛡️ DevTrails — AI & Fraud Prevention Engine",
    description=(
        "**FRS (Fraud Risk Score) Pipeline** for parametric income protection.\n\n"
        "Scores every payout claim 0–100 using a 4-gate validation system:\n"
        "- **Gate 1** — The Bouncer (Rule-Based Filters)\n"
        "- **Gate 2** — Speed Camera (GPS Velocity AI)\n"
        "- **Gate 3** — Outlier Detector (Earnings & Activity Anomalies)\n"
        "- **Gate 4** — Network Mapper (Group Collusion AI)\n\n"
        "**Decision Bands:**\n"
        "| FRS Score | Decision |\n"
        "|---|---|\n"
        "| 0–30 | ✅ AUTO-APPROVE — Full UPI payout in 10 min |\n"
        "| 31–65 | ⏳ PARTIAL HOLD — 90% released, 10% held 24hr |\n"
        "| 66–100 | 🛑 FULL WITHHOLD — Manual review |"
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helper: FRS Decision ───────────────────────────────────────────

def get_frs_decision(score: int) -> tuple[FRSDecision, str]:
    """Map FRS score to decision band."""
    if score <= AUTO_APPROVE_MAX:
        return (
            FRSDecision.AUTO_APPROVE,
            f"✅ AUTO-APPROVE — FRS {score}/100. Full payout released via UPI immediately."
        )
    elif score <= PARTIAL_HOLD_MAX:
        return (
            FRSDecision.PARTIAL_HOLD,
            f"⏳ PARTIAL HOLD — FRS {score}/100. 90% released immediately, "
            f"10% held for 24-hour automated review."
        )
    else:
        return (
            FRSDecision.FULL_WITHHOLD,
            f"🛑 FULL WITHHOLD — FRS {score}/100. Entire payout held. "
            f"Worker notified within 10 min. Manual review within 48 hours."
        )


# ─── Health Check ────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    """Check if the FRS Engine is running."""
    return {
        "status": "healthy",
        "service": "FRS Fraud Detection Engine",
        "version": "1.0.0",
        "gates_active": ["Gate 1 — Bouncer"],
        "registered_claims": get_claim_store_size(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ─── Gate 1 Endpoint (Individual Test) ──────────────────────────────

@app.post(
    "/api/v1/fraud/gate/1",
    response_model=FRSResult,
    tags=["Individual Gates"],
    summary="🚪 Gate 1 — The Bouncer (Rule-Based Filters)",
    description=(
        "Run **only Gate 1** on a claim.\n\n"
        "**Checks performed:**\n"
        "1. **F4 — Duplicate Claim Detection:** SHA-256 hash of "
        "`(worker_id + event_type + epoch_hour)`. Duplicate → FRS = 100.\n"
        "2. **48-Hour Policy Age Check:** First-time policies must be ≥48hrs old. "
        "Renewals are exempt.\n\n"
        "**Test it:** Submit the same claim twice — the second submission should return FRS = 100."
    )
)
async def test_gate1(claim: ClaimRequest):
    """Test Gate 1 in isolation."""
    gate_results = run_gate1(claim)

    # Calculate FRS from gate results
    total_frs = sum(r.frs_points for r in gate_results)
    total_frs = min(total_frs, FRS_MAX_SCORE)

    decision, description = get_frs_decision(total_frs)

    return FRSResult(
        worker_id=claim.worker.worker_id,
        event_type=claim.event_type,
        frs_score=total_frs,
        decision=decision,
        decision_description=description,
        gate_results=gate_results,
        timestamp=datetime.now(timezone.utc)
    )


# ─── Full FRS Pipeline ──────────────────────────────────────────────

@app.post(
    "/api/v1/fraud/score",
    response_model=FRSResult,
    tags=["Full Pipeline"],
    summary="🛡️ Full FRS Pipeline — All Gates",
    description=(
        "Run the **complete 4-gate fraud detection pipeline** on a claim.\n\n"
        "Currently active gates:\n"
        "- ✅ Gate 1 — The Bouncer (Rule-Based Filters)\n"
        "- 🔜 Gate 2 — Speed Camera (coming next)\n"
        "- 🔜 Gate 3 — Outlier Detector (coming next)\n"
        "- 🔜 Gate 4 — Network Mapper (coming next)\n\n"
        "**FRS = F1 + F2 + F3 + F5 + zone_anomaly_bonus**, capped at 100."
    )
)
async def full_frs_pipeline(claim: ClaimRequest):
    """Run all active gates and return the aggregated FRS score + decision."""
    all_gate_results: list[GateResult] = []

    # ── Gate 1: The Bouncer ──
    gate1_results = run_gate1(claim)
    all_gate_results.extend(gate1_results)

    # Check for hard stop (duplicate claim or policy too new)
    if any(r.hard_stop for r in gate1_results):
        total_frs = FRS_MAX_SCORE
        decision, description = get_frs_decision(total_frs)
        return FRSResult(
            worker_id=claim.worker.worker_id,
            event_type=claim.event_type,
            frs_score=total_frs,
            decision=decision,
            decision_description=description,
            gate_results=all_gate_results,
            timestamp=datetime.now(timezone.utc)
        )

    # ── Gate 2, 3, 4 will be added here ──
    # (Placeholder — each gate returns GateResult objects)

    # ── Zone Anomaly Bonus ──
    zone_bonus = 0
    if (claim.zone_claims_count is not None and
        claim.zone_historical_baseline is not None and
        claim.zone_historical_baseline > 0):
        if claim.zone_claims_count > 3 * claim.zone_historical_baseline:
            zone_bonus = ZONE_ANOMALY_BONUS
            all_gate_results.append(GateResult(
                gate_name="Zone Anomaly Bonus",
                gate_id=0,
                passed=True,
                frs_points=ZONE_ANOMALY_BONUS,
                details=f"Zone claims ({claim.zone_claims_count}) exceed "
                        f"3× historical baseline ({claim.zone_historical_baseline}). "
                        f"+{ZONE_ANOMALY_BONUS} FRS points.",
                hard_stop=False
            ))

    # ── Aggregate ──
    total_frs = sum(r.frs_points for r in all_gate_results)
    total_frs = min(total_frs, FRS_MAX_SCORE)

    decision, description = get_frs_decision(total_frs)

    return FRSResult(
        worker_id=claim.worker.worker_id,
        event_type=claim.event_type,
        frs_score=total_frs,
        decision=decision,
        decision_description=description,
        gate_results=all_gate_results,
        timestamp=datetime.now(timezone.utc)
    )


# ─── Utility Endpoints ──────────────────────────────────────────────

@app.post(
    "/api/v1/admin/reset-claims",
    tags=["Admin"],
    summary="🔄 Reset Duplicate Claim Store",
    description="Clears all registered claim hashes. Use this to reset between test runs."
)
async def reset_claims():
    """Clear the in-memory claim hash store for testing."""
    old_size = get_claim_store_size()
    clear_claim_store()
    return {
        "message": f"Cleared {old_size} claim hashes. Store is now empty.",
        "previous_count": old_size,
        "current_count": 0
    }
