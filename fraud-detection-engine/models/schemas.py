"""
Pydantic schemas for the FRS Engine.
All inputs/outputs for the fraud detection pipeline.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


# ─── Enums ───────────────────────────────────────────────────────────

class EventType(str, Enum):
    HEAVY_RAIN = "heavy_rain"
    PLATFORM_OUTAGE = "platform_outage"
    CURFEW = "curfew"
    FESTIVAL_TRAFFIC = "festival_traffic"
    FUEL_SHORTAGE = "fuel_shortage"


class FRSDecision(str, Enum):
    AUTO_APPROVE = "AUTO_APPROVE"
    PARTIAL_HOLD = "PARTIAL_HOLD"
    FULL_WITHHOLD = "FULL_WITHHOLD"


# ─── GPS Data ────────────────────────────────────────────────────────

class GPSPing(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    timestamp: datetime = Field(..., description="When this GPS ping was recorded")


# ─── Worker & Earnings Data ──────────────────────────────────────────

class WorkerData(BaseModel):
    worker_id: str = Field(..., description="Unique worker identifier")
    device_id: Optional[str] = Field(None, description="Device identifier for group fraud detection")
    upi_id: Optional[str] = Field(None, description="UPI handle for group fraud detection")

    # Earnings data (for Gate 3 - Outlier detection)
    avg_earnings_14d: Optional[float] = Field(None, ge=0, description="Average daily earnings over last 14 days (₹)")
    avg_earnings_4wk: Optional[float] = Field(None, ge=0, description="Average daily earnings over prior 4 weeks (₹)")
    zone_90th_percentile: Optional[float] = Field(None, ge=0, description="Zone 90th percentile daily earnings (₹)")

    # Activity data (for Gate 3 - Activity gaming)
    deliveries_24hr_before_event: Optional[int] = Field(None, ge=0, description="Deliveries in 24hrs before event")
    rolling_avg_deliveries_24hr: Optional[float] = Field(None, ge=0, description="Rolling average 24hr delivery count")

    # GPS history (for Gate 2 - Velocity check)
    gps_history: Optional[list[GPSPing]] = Field(None, description="Last 10 GPS pings for velocity analysis")


# ─── Policy Data ─────────────────────────────────────────────────────

class PolicyData(BaseModel):
    policy_start_time: datetime = Field(..., description="When the current policy was activated")
    is_renewal: bool = Field(False, description="True if this is a renewal, not first-time activation")


# ─── Claim Request (Main Input) ─────────────────────────────────────

class ClaimRequest(BaseModel):
    """The main input to the FRS pipeline. Contains all data needed for fraud scoring."""
    worker: WorkerData
    policy: PolicyData
    event_type: EventType = Field(..., description="Type of disruption event being claimed")
    event_timestamp: datetime = Field(..., description="When the disruption event started")
    zone_id: Optional[str] = Field(None, description="H3 hexagonal zone identifier")
    zone_claims_count: Optional[int] = Field(None, ge=0, description="Number of claims from this zone (for zone anomaly check)")
    zone_historical_baseline: Optional[int] = Field(None, ge=0, description="Historical average claims for this zone")


# ─── Gate Results ────────────────────────────────────────────────────

class GateResult(BaseModel):
    gate_name: str
    gate_id: int
    passed: bool = Field(..., description="True if claim passed this gate (not blocked)")
    frs_points: int = Field(0, ge=0, description="FRS points added by this gate")
    details: str = Field("", description="Human-readable explanation of the gate's finding")
    hard_stop: bool = Field(False, description="If True, FRS=100 and no further gates are evaluated")


# ─── FRS Result (Main Output) ────────────────────────────────────────

class FRSResult(BaseModel):
    """The final output of the FRS pipeline."""
    worker_id: str
    event_type: EventType
    frs_score: int = Field(..., ge=0, le=100, description="Final Fraud Risk Score (0-100)")
    decision: FRSDecision
    decision_description: str = Field(..., description="What happens based on this score")
    gate_results: list[GateResult] = Field(..., description="Breakdown of each gate's contribution")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ─── Batch Models (for /verify-claims) ───────────────────────────────

class BatchClaimItem(BaseModel):
    """A single claim item in a batch request from the Go backend."""
    worker_id: str = Field(..., description="Unique worker identifier")
    device_id: Optional[str] = None
    upi_id: Optional[str] = None
    event_type: EventType
    event_timestamp: datetime
    policy_start_time: datetime
    is_renewal: bool = False
    zone_id: Optional[str] = None
    # GPS data
    gps_history: Optional[list[GPSPing]] = None
    # Earnings data (for Gate 3)
    avg_earnings_14d: Optional[float] = None
    avg_earnings_4wk: Optional[float] = None
    zone_90th_percentile: Optional[float] = None
    deliveries_24hr_before_event: Optional[int] = None
    rolling_avg_deliveries_24hr: Optional[float] = None


class BatchClaimRequest(BaseModel):
    """Batch of claims sent by the Go backend after a parametric trigger fires."""
    claims: list[BatchClaimItem] = Field(..., min_length=1, description="List of worker claims to verify")
    zone_claims_count: Optional[int] = Field(None, description="Total claims from this zone")
    zone_historical_baseline: Optional[int] = Field(None, description="Historical avg claims for zone")


class BatchFRSResultItem(BaseModel):
    """Simplified per-worker result for batch response (matches Go backend expected format)."""
    user_id: str
    frs_score: int
    decision: str


class BatchFRSResponse(BaseModel):
    """Full batch response with both simplified and detailed results."""
    results: list[BatchFRSResultItem] = Field(..., description="Simplified results for Go backend")
    detailed_results: list[FRSResult] = Field(..., description="Full gate-by-gate breakdown")


# ─── Group Fraud Context (for Gate 4) ───────────────────────────────

class GroupFraudWorker(BaseModel):
    """Represents one worker in a group fraud analysis batch."""
    worker_id: str
    device_id: Optional[str] = None
    upi_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    claim_timestamp: Optional[datetime] = None


class GroupFraudRequest(BaseModel):
    """Batch of workers to analyze for group collusion patterns."""
    workers: list[GroupFraudWorker] = Field(..., min_length=2, description="List of workers filing claims")
    event_type: EventType
    event_timestamp: datetime
