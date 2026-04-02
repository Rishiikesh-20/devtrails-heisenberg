"""
Gate 3 — The Outlier Detector (Earnings & Activity Anomalies)
==============================================================
Catches riders who artificially inflate their earnings or game their
activity metrics to collect larger payouts.

F2 — Earnings Inflation:
  Compares 14-day avg earnings with 4-week avg earnings.
  If 14-day avg > 3× the 4-week avg → suspicious inflation → +60 FRS.
  Also checks against zone 90th percentile cap.

  Real-world context:
  A rider normally earns ₹500/day. Suddenly they show ₹2000/day for
  the last 2 weeks. They might be exploiting platform bonuses, multi-
  accounting, or fabricating delivery records to inflate payout amount.

F3 — Activity Gaming (Delivery Spike):
  Compares deliveries in the 24 hours before the event with the
  worker's rolling average.
  If spike ratio > 3.0 → +25 FRS (extreme gaming)
  If spike ratio > 1.5 → +12 FRS (moderate gaming)

  Real-world context:
  A rider normally does 8 deliveries/day. On the day before claiming
  rain disruption, they did 30 deliveries. Why? To pump up the
  "daily earnings" figure so the parametric payout is higher.
"""

from models.schemas import ClaimRequest, GateResult
from config import (
    F2_EARNINGS_INFLATION_POINTS,
    F3_ACTIVITY_GAMING_HIGH_POINTS,
    F3_ACTIVITY_GAMING_MED_POINTS,
    EARNINGS_SPIKE_THRESHOLD,
    ACTIVITY_SPIKE_HIGH,
    ACTIVITY_SPIKE_MED,
)


def check_earnings_inflation(claim: ClaimRequest) -> GateResult:
    """
    F2 — Earnings Inflation Check.
    Compares the worker's 14-day average earnings with their 4-week average.
    If the ratio exceeds the threshold (3×), flag as inflation.
    Also checks against the zone's 90th percentile earnings cap.
    """
    avg_14d = claim.worker.avg_earnings_14d
    avg_4wk = claim.worker.avg_earnings_4wk
    zone_cap = claim.worker.zone_90th_percentile

    # If no earnings data provided, skip this check
    if avg_14d is None or avg_4wk is None:
        return GateResult(
            gate_name="Earnings Inflation Check (F2)",
            gate_id=3,
            passed=True,
            frs_points=0,
            details="No earnings data provided. Gate 3 F2 skipped — "
                    "insufficient data for earnings analysis.",
            hard_stop=False
        )

    # Avoid division by zero
    if avg_4wk <= 0:
        return GateResult(
            gate_name="Earnings Inflation Check (F2)",
            gate_id=3,
            passed=True,
            frs_points=0,
            details="4-week average earnings is zero or negative. Cannot compute ratio. Skipped.",
            hard_stop=False
        )

    # Calculate the spike ratio
    earnings_ratio = avg_14d / avg_4wk

    # Check 1: Is 14-day avg suspiciously higher than 4-week avg?
    if earnings_ratio >= EARNINGS_SPIKE_THRESHOLD:
        details = (
            f"🚨 EARNINGS INFLATION DETECTED — "
            f"14-day avg (₹{avg_14d:.0f}) is {earnings_ratio:.1f}× the "
            f"4-week avg (₹{avg_4wk:.0f}). "
            f"Threshold: {EARNINGS_SPIKE_THRESHOLD}×. "
            f"Rider may be artificially inflating earnings before claiming. "
            f"+{F2_EARNINGS_INFLATION_POINTS} FRS points."
        )

        # Also flag if exceeds zone cap
        if zone_cap is not None and avg_14d > zone_cap:
            details += (
                f" Also exceeds zone 90th percentile cap (₹{zone_cap:.0f})."
            )

        return GateResult(
            gate_name="Earnings Inflation Check (F2)",
            gate_id=3,
            passed=False,
            frs_points=F2_EARNINGS_INFLATION_POINTS,
            details=details,
            hard_stop=False
        )

    # Check 2: Even if ratio is ok, flag if zone cap is exceeded
    if zone_cap is not None and avg_14d > zone_cap:
        return GateResult(
            gate_name="Earnings Inflation Check (F2)",
            gate_id=3,
            passed=False,
            frs_points=F2_EARNINGS_INFLATION_POINTS,
            details=(
                f"🚨 EARNINGS CAP EXCEEDED — "
                f"14-day avg (₹{avg_14d:.0f}) exceeds zone 90th percentile "
                f"cap (₹{zone_cap:.0f}). Earnings ratio: {earnings_ratio:.1f}×. "
                f"+{F2_EARNINGS_INFLATION_POINTS} FRS points."
            ),
            hard_stop=False
        )

    return GateResult(
        gate_name="Earnings Inflation Check (F2)",
        gate_id=3,
        passed=True,
        frs_points=0,
        details=(
            f"Earnings check passed. 14-day avg: ₹{avg_14d:.0f}, "
            f"4-week avg: ₹{avg_4wk:.0f}, ratio: {earnings_ratio:.1f}× "
            f"(threshold: {EARNINGS_SPIKE_THRESHOLD}×)."
        ),
        hard_stop=False
    )


def check_activity_gaming(claim: ClaimRequest) -> GateResult:
    """
    F3 — Activity Gaming / Delivery Spike Detection.
    Compares deliveries in the 24 hours before the event with
    the worker's rolling average.
    Spike ratio > 3.0 → +25 FRS (extreme gaming)
    Spike ratio > 1.5 → +12 FRS (moderate gaming)
    """
    deliveries_24hr = claim.worker.deliveries_24hr_before_event
    rolling_avg = claim.worker.rolling_avg_deliveries_24hr

    # If no activity data provided, skip this check
    if deliveries_24hr is None or rolling_avg is None:
        return GateResult(
            gate_name="Activity Gaming Check (F3)",
            gate_id=3,
            passed=True,
            frs_points=0,
            details="No activity/delivery data provided. Gate 3 F3 skipped — "
                    "insufficient data for activity analysis.",
            hard_stop=False
        )

    # Avoid division by zero
    if rolling_avg <= 0:
        if deliveries_24hr > 0:
            # Worker has no history but suddenly did deliveries — suspicious
            return GateResult(
                gate_name="Activity Gaming Check (F3)",
                gate_id=3,
                passed=False,
                frs_points=F3_ACTIVITY_GAMING_HIGH_POINTS,
                details=(
                    f"🚨 ACTIVITY GAMING — Worker has no delivery history "
                    f"(rolling avg: 0) but did {deliveries_24hr} deliveries "
                    f"in the 24hr before the event. +{F3_ACTIVITY_GAMING_HIGH_POINTS} FRS points."
                ),
                hard_stop=False
            )
        return GateResult(
            gate_name="Activity Gaming Check (F3)",
            gate_id=3,
            passed=True,
            frs_points=0,
            details="Rolling average is zero and no recent deliveries. Skipped.",
            hard_stop=False
        )

    spike_ratio = deliveries_24hr / rolling_avg

    # High spike: > 3× normal
    if spike_ratio >= ACTIVITY_SPIKE_HIGH:
        return GateResult(
            gate_name="Activity Gaming Check (F3)",
            gate_id=3,
            passed=False,
            frs_points=F3_ACTIVITY_GAMING_HIGH_POINTS,
            details=(
                f"🚨 ACTIVITY GAMING (HIGH) — {deliveries_24hr} deliveries in 24hr "
                f"before event vs rolling avg of {rolling_avg:.1f}. "
                f"Spike ratio: {spike_ratio:.1f}× (threshold: {ACTIVITY_SPIKE_HIGH}×). "
                f"Rider likely pumped deliveries to inflate payout. "
                f"+{F3_ACTIVITY_GAMING_HIGH_POINTS} FRS points."
            ),
            hard_stop=False
        )

    # Medium spike: > 1.5× normal
    if spike_ratio >= ACTIVITY_SPIKE_MED:
        return GateResult(
            gate_name="Activity Gaming Check (F3)",
            gate_id=3,
            passed=False,
            frs_points=F3_ACTIVITY_GAMING_MED_POINTS,
            details=(
                f"⚠️ ACTIVITY GAMING (MEDIUM) — {deliveries_24hr} deliveries in 24hr "
                f"before event vs rolling avg of {rolling_avg:.1f}. "
                f"Spike ratio: {spike_ratio:.1f}× (threshold: {ACTIVITY_SPIKE_MED}×). "
                f"+{F3_ACTIVITY_GAMING_MED_POINTS} FRS points."
            ),
            hard_stop=False
        )

    return GateResult(
        gate_name="Activity Gaming Check (F3)",
        gate_id=3,
        passed=True,
        frs_points=0,
        details=(
            f"Activity check passed. {deliveries_24hr} deliveries in 24hr, "
            f"rolling avg: {rolling_avg:.1f}, spike ratio: {spike_ratio:.1f}× "
            f"(high threshold: {ACTIVITY_SPIKE_HIGH}×, med threshold: {ACTIVITY_SPIKE_MED}×)."
        ),
        hard_stop=False
    )


def run_gate3(claim: ClaimRequest) -> list[GateResult]:
    """
    Run all Gate 3 checks. Returns list of results.
    F2 and F3 are independent checks — both always run.
    """
    results = []

    # Check 1: Earnings inflation (F2)
    earnings_result = check_earnings_inflation(claim)
    results.append(earnings_result)

    # Check 2: Activity gaming (F3)
    activity_result = check_activity_gaming(claim)
    results.append(activity_result)

    return results
