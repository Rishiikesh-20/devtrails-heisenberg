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
    FRSDecision, EventType,
    BatchClaimRequest, BatchClaimItem, BatchFRSResponse, BatchFRSResultItem,
    WorkerData, PolicyData,
    GroupFraudRequest, GroupFraudWorker
)
from gates.gate1_bouncer import run_gate1, clear_claim_store, get_claim_store_size
from gates.gate2_velocity import run_gate2
from gates.gate3_outlier import run_gate3
from gates.gate4_network import run_gate4_for_worker, run_gate4_batch, analyze_group_fraud
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
        "gates_active": ["Gate 1 — Bouncer", "Gate 2 — Speed Camera", "Gate 3 — Outlier Detector", "Gate 4 — Network Mapper"],
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


# ─── Gate 2 Endpoint (Individual Test) ──────────────────────────────

@app.post(
    "/api/v1/fraud/gate/2",
    response_model=FRSResult,
    tags=["Individual Gates"],
    summary="📸 Gate 2 — The Speed Camera (GPS Velocity AI)",
    description=(
        "Run **only Gate 2** on a claim.\n\n"
        "**Checks performed:**\n"
        "- **F1 — GPS Velocity Anomaly:** Haversine distance ÷ time between "
        "consecutive GPS pings. Speed > 90 km/hr → +35 FRS (impossible for delivery bike).\n\n"
        "**Requires:** `gps_history` with at least 2 GPS pings in the worker data.\n\n"
        "**Test it:** Send pings that are 10km apart but only 1 minute apart — "
        "that's 600 km/hr, obvious GPS spoofing!"
    )
)
async def test_gate2(claim: ClaimRequest):
    """Test Gate 2 in isolation (skips Gate 1)."""
    gate_results = run_gate2(claim)
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


# ─── Gate 3 Endpoint (Individual Test) ──────────────────────────────

@app.post(
    "/api/v1/fraud/gate/3",
    response_model=FRSResult,
    tags=["Individual Gates"],
    summary="📊 Gate 3 — The Outlier Detector (Earnings & Activity AI)",
    description=(
        "Run **only Gate 3** on a claim.\n\n"
        "**Checks performed:**\n"
        "- **F2 — Earnings Inflation:** 14-day avg vs 4-week avg. If 3× higher → +60 FRS.\n"
        "- **F3 — Activity Gaming:** Deliveries in 24hr before event vs rolling avg. "
        "3× spike → +25, 1.5× spike → +12 FRS.\n\n"
        "**Requires:** Earnings and activity fields in worker data.\n\n"
        "**Test it:** Set `avg_earnings_14d: 1500` and `avg_earnings_4wk: 400` — "
        "that's 3.75× inflation!"
    )
)
async def test_gate3(claim: ClaimRequest):
    """Test Gate 3 in isolation (skips Gates 1 & 2)."""
    gate_results = run_gate3(claim)
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


# ─── Gate 4 Endpoint (Batch Test) ───────────────────────────────

@app.post(
    "/api/v1/fraud/gate/4",
    tags=["Individual Gates"],
    summary="🔗 Gate 4 — The Network Mapper (Group Collusion AI)",
    description=(
        "Run **only Gate 4** on a batch of workers.\n\n"
        "**Unlike Gates 1-3**, this gate requires a **batch of workers** "
        "(not a single claim) because collusion is about relationships between workers.\n\n"
        "**Checks performed:**\n"
        "- **Shared Device ID:** Multiple accounts on the same phone\n"
        "- **Shared UPI ID:** Multiple accounts paying to the same bank\n"
        "- **GPS Co-Location:** Workers within 50 meters of each other\n\n"
        "If cluster ≥ 5 workers → +20 FRS per flagged worker.\n\n"
        "**Test it:** Send 6 workers sharing the same device_id!"
    )
)
async def test_gate4(request: GroupFraudRequest):
    """Test Gate 4 group fraud analysis on a batch of workers."""
    analysis = analyze_group_fraud(request.workers)
    per_worker_results = run_gate4_batch(request)

    return {
        "analysis_summary": {
            "total_workers": len(request.workers),
            "total_flagged": analysis["total_flagged"],
            "device_clusters": analysis["device_clusters"],
            "upi_clusters": analysis["upi_clusters"],
            "gps_clusters": analysis["gps_clusters"],
        },
        "per_worker_results": {
            wid: [r.model_dump() for r in results]
            for wid, results in per_worker_results.items()
        }
    }


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
        "- ✅ Gate 2 — Speed Camera (GPS Velocity AI)\n"
        "- ✅ Gate 3 — Outlier Detector (Earnings & Activity AI)\n"
        "- ✅ Gate 4 — Network Mapper (Group Collusion AI)\n\n"
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

    # ── Gate 2: The Speed Camera ──
    gate2_results = run_gate2(claim)
    all_gate_results.extend(gate2_results)

    # ── Gate 3: The Outlier Detector ──
    gate3_results = run_gate3(claim)
    all_gate_results.extend(gate3_results)

    # ── Gate 4: The Network Mapper ──
    # Note: Gate 4 runs fully in /verify-claims (batch context).
    # For single claims, we skip it since group fraud needs batch data.
    all_gate_results.append(GateResult(
        gate_name="Group Fraud Detection (F5)",
        gate_id=4,
        passed=True,
        frs_points=0,
        details="Gate 4 skipped for single claim. Group fraud analysis "
                "requires batch context (use /verify-claims endpoint).",
        hard_stop=False
    ))

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


# ─── Batch Endpoint (Go Backend Integration) ───────────────────────

@app.post(
    "/verify-claims",
    response_model=BatchFRSResponse,
    tags=["Batch Pipeline"],
    summary="📦 Batch Verify Claims (Go Backend Integration)",
    description=(
        "**The main endpoint called by the Go backend.**\n\n"
        "Receives a batch of worker claims after a parametric trigger fires.\n"
        "Runs all 4 fraud gates on each claim and returns:\n"
        "- `results`: Simplified format `[{user_id, frs_score, decision}]` for the Go backend\n"
        "- `detailed_results`: Full gate-by-gate breakdown for audit logging\n\n"
        "**Flow:** Go Trigger Controller → POST /verify-claims → FRS Engine → Response back to Go"
    )
)
async def verify_claims_batch(batch: BatchClaimRequest):
    """Process a batch of claims from the Go backend through all fraud gates."""
    simplified_results: list[BatchFRSResultItem] = []
    detailed_results: list[FRSResult] = []

    # ── Build Gate 4 batch context ──
    # Convert all claims to GroupFraudWorker format for group fraud analysis
    batch_workers = []
    for item in batch.claims:
        last_gps = None
        if item.gps_history and len(item.gps_history) > 0:
            last_gps = item.gps_history[-1]  # Use most recent GPS ping

        batch_workers.append(GroupFraudWorker(
            worker_id=item.worker_id,
            device_id=item.device_id,
            upi_id=item.upi_id,
            latitude=last_gps.latitude if last_gps else None,
            longitude=last_gps.longitude if last_gps else None,
            claim_timestamp=item.event_timestamp,
        ))

    # Run Gate 4 batch analysis once (shared across all workers)
    group_fraud_request = GroupFraudRequest(
        workers=batch_workers,
        event_type=batch.claims[0].event_type,
        event_timestamp=batch.claims[0].event_timestamp,
    )
    gate4_results_by_worker = run_gate4_batch(group_fraud_request)

    # ── Process each claim through Gates 1-3, then append Gate 4 ──
    for item in batch.claims:
        claim = ClaimRequest(
            worker=WorkerData(
                worker_id=item.worker_id,
                device_id=item.device_id,
                upi_id=item.upi_id,
                avg_earnings_14d=item.avg_earnings_14d,
                avg_earnings_4wk=item.avg_earnings_4wk,
                zone_90th_percentile=item.zone_90th_percentile,
                deliveries_24hr_before_event=item.deliveries_24hr_before_event,
                rolling_avg_deliveries_24hr=item.rolling_avg_deliveries_24hr,
                gps_history=item.gps_history,
            ),
            policy=PolicyData(
                policy_start_time=item.policy_start_time,
                is_renewal=item.is_renewal,
            ),
            event_type=item.event_type,
            event_timestamp=item.event_timestamp,
            zone_id=item.zone_id,
            zone_claims_count=batch.zone_claims_count,
            zone_historical_baseline=batch.zone_historical_baseline,
        )

        # Run Gates 1-3 via the full pipeline
        frs_result = await full_frs_pipeline(claim)

        # Replace the "Gate 4 skipped" placeholder with real Gate 4 results
        gate_results_without_g4_placeholder = [
            r for r in frs_result.gate_results
            if not (r.gate_id == 4 and "skipped" in r.details.lower())
        ]

        # Add real Gate 4 results from batch analysis
        worker_g4_results = gate4_results_by_worker.get(item.worker_id, [])
        gate_results_without_g4_placeholder.extend(worker_g4_results)

        # Recalculate total FRS with Gate 4 included
        total_frs = sum(r.frs_points for r in gate_results_without_g4_placeholder)
        total_frs = min(total_frs, FRS_MAX_SCORE)
        decision, description = get_frs_decision(total_frs)

        updated_result = FRSResult(
            worker_id=item.worker_id,
            event_type=claim.event_type,
            frs_score=total_frs,
            decision=decision,
            decision_description=description,
            gate_results=gate_results_without_g4_placeholder,
            timestamp=datetime.now(timezone.utc),
        )

        detailed_results.append(updated_result)
        simplified_results.append(BatchFRSResultItem(
            user_id=item.worker_id,
            frs_score=total_frs,
            decision=decision.value,
        ))

    return BatchFRSResponse(
        results=simplified_results,
        detailed_results=detailed_results,
    )

