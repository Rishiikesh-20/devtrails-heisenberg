import hashlib
import os
from datetime import datetime, timezone

import pandas as pd
import redis
from fastapi import FastAPI
from pydantic import BaseModel, Field


class TierRequest(BaseModel):
    zone: str = Field(..., min_length=1)
    shift_start: str = Field(..., min_length=1)
    shift_end: str = Field(..., min_length=1)


class TierResponse(BaseModel):
    tier: int
    weekly_premium: float
    scored_at: str


class FRSRequest(BaseModel):
    claim_id: str = Field(..., min_length=1)
    claim_hash: str | None = None
    user_id: str = Field(..., min_length=1)
    zone: str = Field(..., min_length=1)
    claimed_amount: float = Field(..., ge=0)
    avg_weekly_earnings: float = Field(..., ge=0)
    recent_claims: int = Field(0, ge=0)
    shared_device_count: int = Field(0, ge=0)
    linked_account_count: int = Field(0, ge=0)


class FRSResponse(BaseModel):
    frs_score: int
    status: str
    gate_scores: dict[str, int]
    evaluated_at: str


class VerifyClaimItem(BaseModel):
    user_id: str = Field(..., min_length=1)
    event_type: str = Field(..., min_length=1)
    event_timestamp: int
    zone: str = Field(..., min_length=1)
    claimed_amount: float = Field(..., ge=0)
    avg_weekly_earnings: float = Field(..., ge=0)
    recent_claims: int = Field(0, ge=0)
    shared_device_count: int = Field(0, ge=0)
    linked_account_count: int = Field(0, ge=0)


class ClaimDecision(BaseModel):
    user_id: str
    frs_score: int
    decision: str


app = FastAPI(title="DevTrails FRS and Risk Engine", version="0.2.0")


def get_redis() -> redis.Redis:
    return redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        db=int(os.getenv("REDIS_DB", "0")),
        decode_responses=True,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-engine-python"}


@app.post("/calculate-tier", response_model=TierResponse)
def calculate_tier(payload: TierRequest) -> TierResponse:
    zone_risk = {
        "zone-a": 1,
        "zone-b": 2,
        "zone-c": 3,
    }
    shift_risk = 2 if payload.shift_start.startswith("22") or payload.shift_start.startswith("23") else 1
    risk = zone_risk.get(payload.zone.lower(), 2) + shift_risk

    if risk <= 2:
        tier, premium = 1, 12.5
    elif risk <= 4:
        tier, premium = 2, 22.0
    else:
        tier, premium = 3, 34.0

    return TierResponse(
        tier=tier,
        weekly_premium=premium,
        scored_at=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/evaluate-frs", response_model=FRSResponse)
def evaluate_frs(payload: FRSRequest) -> FRSResponse:
    rdb = get_redis()

    claim_hash = payload.claim_hash or hashlib.sha256(
        f"{payload.user_id}:{payload.claim_id}:{payload.claimed_amount}".encode("utf-8")
    ).hexdigest()

    gate_1 = gate_duplicate_hash(rdb, claim_hash)
    gate_2 = gate_velocity_check(rdb, payload.user_id)
    gate_3 = gate_earnings_outlier(payload.claimed_amount, payload.avg_weekly_earnings)
    gate_4 = gate_network_cluster(payload.shared_device_count, payload.linked_account_count)

    score = min(100, gate_1 + gate_2 + gate_3 + gate_4)
    if score <= 35:
        status = "AUTO-APPROVE"
    elif score <= 70:
        status = "HOLD"
    else:
        status = "WITHHOLD"

    return FRSResponse(
        frs_score=score,
        status=status,
        gate_scores={
            "gate_1_duplicate_hash": gate_1,
            "gate_2_velocity": gate_2,
            "gate_3_earnings_outlier": gate_3,
            "gate_4_network_cluster": gate_4,
        },
        evaluated_at=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/verify-claims", response_model=list[ClaimDecision])
def verify_claims(batch: list[VerifyClaimItem]) -> list[ClaimDecision]:
    results: list[ClaimDecision] = []

    for item in batch:
        score = evaluate_claim_score(
            user_id=item.user_id,
            claimed_amount=item.claimed_amount,
            avg_weekly_earnings=item.avg_weekly_earnings,
            recent_claims=item.recent_claims,
            shared_device_count=item.shared_device_count,
            linked_account_count=item.linked_account_count,
        )

        results.append(
            ClaimDecision(
                user_id=item.user_id,
                frs_score=score,
                decision=decision_from_score(score),
            )
        )

    return results


def evaluate_claim_score(
    user_id: str,
    claimed_amount: float,
    avg_weekly_earnings: float,
    recent_claims: int,
    shared_device_count: int,
    linked_account_count: int,
) -> int:
    claim_hash = hashlib.sha256(
        f"{user_id}:{claimed_amount}:{recent_claims}".encode("utf-8")
    ).hexdigest()

    rdb = get_redis()
    gate_1 = gate_duplicate_hash(rdb, claim_hash)
    gate_2 = gate_velocity_check(rdb, user_id)
    gate_3 = gate_earnings_outlier(claimed_amount, avg_weekly_earnings)
    gate_4 = gate_network_cluster(shared_device_count, linked_account_count)

    return min(100, gate_1 + gate_2 + gate_3 + gate_4)


def decision_from_score(score: int) -> str:
    if score <= 30:
        return "AUTO-APPROVE"
    if score <= 65:
        return "PARTIAL_HOLD"
    return "FULL_WITHHOLD"


def gate_duplicate_hash(rdb: redis.Redis, claim_hash: str) -> int:
    key = f"frs:gate1:claim-hash:{claim_hash}"
    existed = rdb.exists(key)
    if existed:
        return 35
    rdb.setex(key, 60 * 60 * 24, "1")
    return 0


def gate_velocity_check(rdb: redis.Redis, user_id: str) -> int:
    key = f"frs:gate2:velocity:{user_id}:{datetime.now(timezone.utc).strftime('%Y%m%d%H')}"
    count = rdb.incr(key)
    if count == 1:
        rdb.expire(key, 60 * 60)
    if count >= 4:
        return 25
    if count >= 2:
        return 10
    return 0


def gate_earnings_outlier(claimed_amount: float, avg_weekly_earnings: float) -> int:
    denominator = avg_weekly_earnings if avg_weekly_earnings > 0 else 1.0
    ratio = claimed_amount / denominator

    # Keep logic tabular so this can be replaced with a trained model feature table.
    frame = pd.DataFrame([{"ratio": ratio}])
    ratio_value = float(frame.iloc[0]["ratio"])

    if ratio_value > 2.5:
        return 20
    if ratio_value > 1.5:
        return 8
    return 0


def gate_network_cluster(shared_device_count: int, linked_account_count: int) -> int:
    pressure = shared_device_count + linked_account_count
    if pressure >= 5:
        return 20
    if pressure >= 2:
        return 10
    return 0
