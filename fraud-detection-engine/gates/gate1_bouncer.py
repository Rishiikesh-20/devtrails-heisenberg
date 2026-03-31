"""
Gate 1 — The Bouncer (Rule-Based Filters)
==========================================
Fast, deterministic first-pass that catches obvious fraud instantly.

Two checks:
  F4 — Duplicate Claim Detection: SHA-256 hash of (worker_id + event_type + epoch_hour).
        If hash already exists → FRS = 100, hard stop.
  Policy Age Check: First-time policies must be ≥48 hours old at event time.
        Renewals are exempt from this check.
"""

import hashlib
from datetime import datetime, timezone
from models.schemas import ClaimRequest, GateResult
from config import POLICY_WAITING_PERIOD_HOURS, F4_DUPLICATE_CLAIM_SCORE


# ─── In-Memory Duplicate Store (simulates Redis SETNX) ──────────────
# In production this would be Redis. For demo, we use an in-memory set.
_claim_hashes: set[str] = set()


def _compute_claim_hash(worker_id: str, event_type: str, event_timestamp: datetime) -> str:
    """
    Generate a deterministic hash for deduplication.
    Rounds the event timestamp to the nearest hour so that
    claims for the same event within the same hour are caught.
    """
    # Round to nearest hour (epoch seconds, floored to hour)
    epoch_seconds = int(event_timestamp.timestamp())
    epoch_hour = epoch_seconds - (epoch_seconds % 3600)

    raw = f"{worker_id}|{event_type}|{epoch_hour}"
    return hashlib.sha256(raw.encode()).hexdigest()


def check_duplicate_claim(claim: ClaimRequest) -> GateResult:
    """
    F4 — Duplicate Claim Detection.
    If the same worker has already claimed for the same event type
    in the same hour window → FRS = 100, hard stop.
    """
    claim_hash = _compute_claim_hash(
        worker_id=claim.worker.worker_id,
        event_type=claim.event_type.value,
        event_timestamp=claim.event_timestamp
    )

    if claim_hash in _claim_hashes:
        return GateResult(
            gate_name="Duplicate Claim Detection (F4)",
            gate_id=1,
            passed=False,
            frs_points=F4_DUPLICATE_CLAIM_SCORE,
            details=f"DUPLICATE DETECTED — Claim hash {claim_hash[:16]}... already exists. "
                    f"Worker '{claim.worker.worker_id}' has already filed a "
                    f"'{claim.event_type.value}' claim in this time window.",
            hard_stop=True
        )

    # Register this claim hash
    _claim_hashes.add(claim_hash)

    return GateResult(
        gate_name="Duplicate Claim Detection (F4)",
        gate_id=1,
        passed=True,
        frs_points=0,
        details=f"No duplicate found. Claim hash {claim_hash[:16]}... registered.",
        hard_stop=False
    )


def check_policy_age(claim: ClaimRequest) -> GateResult:
    """
    48-Hour Policy Age Check.
    First-time policies must be at least 48 hours old at event time.
    Renewals are exempt — they carry forward trust from the prior cycle.
    """
    if claim.policy.is_renewal:
        return GateResult(
            gate_name="Policy Age Check (48hr Anti-Timing)",
            gate_id=1,
            passed=True,
            frs_points=0,
            details="Policy is a renewal — exempt from 48-hour waiting period.",
            hard_stop=False
        )

    # Calculate policy age at event time
    policy_start = claim.policy.policy_start_time
    event_time = claim.event_timestamp

    # Make both timezone-aware if they aren't
    if policy_start.tzinfo is None:
        policy_start = policy_start.replace(tzinfo=timezone.utc)
    if event_time.tzinfo is None:
        event_time = event_time.replace(tzinfo=timezone.utc)

    policy_age_hours = (event_time - policy_start).total_seconds() / 3600

    if policy_age_hours < POLICY_WAITING_PERIOD_HOURS:
        return GateResult(
            gate_name="Policy Age Check (48hr Anti-Timing)",
            gate_id=1,
            passed=False,
            frs_points=F4_DUPLICATE_CLAIM_SCORE,
            details=f"REJECTED — Policy is only {policy_age_hours:.1f} hours old. "
                    f"First-time policies require a {POLICY_WAITING_PERIOD_HOURS}-hour "
                    f"waiting period before claims are eligible.",
            hard_stop=True
        )

    return GateResult(
        gate_name="Policy Age Check (48hr Anti-Timing)",
        gate_id=1,
        passed=True,
        frs_points=0,
        details=f"Policy age: {policy_age_hours:.1f} hours — clears the "
                f"{POLICY_WAITING_PERIOD_HOURS}-hour waiting period.",
        hard_stop=False
    )


def run_gate1(claim: ClaimRequest) -> list[GateResult]:
    """
    Run all Gate 1 checks. Returns list of results.
    If any check is a hard stop, subsequent gates should not run.
    """
    results = []

    # Check 1: Duplicate claim
    dup_result = check_duplicate_claim(claim)
    results.append(dup_result)
    if dup_result.hard_stop:
        return results  # No need to check further

    # Check 2: Policy age
    age_result = check_policy_age(claim)
    results.append(age_result)

    return results


def clear_claim_store():
    """Clear the in-memory duplicate store. Useful for testing."""
    _claim_hashes.clear()


def get_claim_store_size() -> int:
    """Get the number of registered claim hashes."""
    return len(_claim_hashes)
