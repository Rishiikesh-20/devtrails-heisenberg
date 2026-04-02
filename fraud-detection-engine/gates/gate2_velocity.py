"""
Gate 2 — The Speed Camera (Geospatial Velocity AI)
====================================================
Catches GPS spoofing by analyzing the physics of a rider's movement.

F1 — GPS Velocity Anomaly:
  Takes the last 10 GPS pings (lat, lon, timestamp).
  Computes Haversine distance ÷ time between consecutive pings.
  If any segment velocity > 1.5 km/min (90 km/hr) → impossible for a
  delivery bike in urban traffic → +35 FRS points.

Real-world context:
  A delivery rider on a bike/scooter in Indian city traffic rarely exceeds
  40-50 km/hr. If GPS says they went 10 km in 2 seconds, they're using a
  GPS spoofing app (like Fake GPS or iTools) to fake their location into
  a disruption zone while sitting at home.
"""

import math
from models.schemas import ClaimRequest, GateResult, GPSPing
from config import F1_GPS_SPOOFING_POINTS, MAX_SPEED_KM_PER_MIN, EARTH_RADIUS_KM


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two GPS points using
    the Haversine formula. Returns distance in kilometers.

    The Haversine formula accounts for Earth's curvature — unlike
    simple Euclidean distance, it works correctly for GPS coordinates.
    """
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (math.sin(dlat / 2) ** 2 +
         math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return EARTH_RADIUS_KM * c


def _analyze_velocity(gps_pings: list[GPSPing]) -> dict:
    """
    Analyze consecutive GPS pings and find the maximum velocity.
    Returns details about every segment and flags the worst violation.
    """
    segments = []
    max_speed_km_per_min = 0.0
    worst_segment = None

    for i in range(len(gps_pings) - 1):
        ping_a = gps_pings[i]
        ping_b = gps_pings[i + 1]

        # Distance between consecutive pings (km)
        distance_km = _haversine_km(
            ping_a.latitude, ping_a.longitude,
            ping_b.latitude, ping_b.longitude
        )

        # Time between pings (minutes)
        time_diff_seconds = abs((ping_b.timestamp - ping_a.timestamp).total_seconds())
        time_diff_minutes = time_diff_seconds / 60.0

        # Calculate speed (km/min), avoid division by zero
        if time_diff_minutes > 0:
            speed_km_per_min = distance_km / time_diff_minutes
        else:
            # Two pings at exact same time but different locations = teleportation
            speed_km_per_min = float('inf')

        speed_km_per_hr = speed_km_per_min * 60

        is_suspicious = speed_km_per_min > MAX_SPEED_KM_PER_MIN

        segment = {
            "segment": f"Ping {i+1} → Ping {i+2}",
            "distance_km": round(distance_km, 3),
            "time_minutes": round(time_diff_minutes, 2),
            "speed_km_per_hr": round(speed_km_per_hr, 1),
            "suspicious": is_suspicious
        }
        segments.append(segment)

        if speed_km_per_min > max_speed_km_per_min:
            max_speed_km_per_min = speed_km_per_min
            worst_segment = segment

    return {
        "segments": segments,
        "max_speed_km_per_min": round(max_speed_km_per_min, 3),
        "max_speed_km_per_hr": round(max_speed_km_per_min * 60, 1),
        "worst_segment": worst_segment,
        "any_suspicious": any(s["suspicious"] for s in segments)
    }


def run_gate2(claim: ClaimRequest) -> list[GateResult]:
    """
    Run Gate 2: GPS Velocity Analysis.

    Requires at least 2 GPS pings in claim.worker.gps_history.
    If no GPS data provided, the gate passes with a warning.
    """
    results = []

    # Check if GPS data is available
    if not claim.worker.gps_history or len(claim.worker.gps_history) < 2:
        results.append(GateResult(
            gate_name="GPS Velocity Analysis (F1)",
            gate_id=2,
            passed=True,
            frs_points=0,
            details="No GPS history provided (fewer than 2 pings). "
                    "Gate 2 skipped — insufficient data for velocity analysis.",
            hard_stop=False
        ))
        return results

    # Analyze velocity across all GPS pings
    analysis = _analyze_velocity(claim.worker.gps_history)

    if analysis["any_suspicious"]:
        worst = analysis["worst_segment"]
        results.append(GateResult(
            gate_name="GPS Velocity Analysis (F1)",
            gate_id=2,
            passed=False,
            frs_points=F1_GPS_SPOOFING_POINTS,
            details=(
                f"🚨 GPS SPOOFING DETECTED — Impossible velocity found! "
                f"{worst['segment']}: {worst['distance_km']} km in "
                f"{worst['time_minutes']} min = {worst['speed_km_per_hr']} km/hr. "
                f"Threshold: {MAX_SPEED_KM_PER_MIN * 60} km/hr. "
                f"A delivery bike in urban traffic cannot exceed this speed. "
                f"+{F1_GPS_SPOOFING_POINTS} FRS points."
            ),
            hard_stop=False
        ))
    else:
        max_speed = analysis["max_speed_km_per_hr"]
        results.append(GateResult(
            gate_name="GPS Velocity Analysis (F1)",
            gate_id=2,
            passed=True,
            frs_points=0,
            details=(
                f"GPS velocity check passed. Max speed detected: "
                f"{max_speed} km/hr across {len(analysis['segments'])} segments. "
                f"All within the {MAX_SPEED_KM_PER_MIN * 60} km/hr threshold."
            ),
            hard_stop=False
        ))

    return results
