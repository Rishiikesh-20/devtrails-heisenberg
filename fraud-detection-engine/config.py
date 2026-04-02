"""
FRS Engine Configuration — All thresholds and constants.
These values come directly from the project's aiml.md specification.
"""

import os

# ─── FRS Point Values ────────────────────────────────────────────────
F1_GPS_SPOOFING_POINTS = 85        # Gate 2: GPS velocity anomaly → FULL WITHHOLD
F2_EARNINGS_INFLATION_POINTS = 60  # Gate 3: Earnings 3× normal → FRS=60 (Partial Hold)
F3_ACTIVITY_GAMING_HIGH_POINTS = 25  # Gate 3: Spike ratio > 3.0
F3_ACTIVITY_GAMING_MED_POINTS = 12   # Gate 3: Spike ratio > 1.5
F4_DUPLICATE_CLAIM_SCORE = 100     # Gate 1: Duplicate = instant 100
F5_GROUP_FRAUD_POINTS = 20         # Gate 4: Group collusion

ZONE_ANOMALY_BONUS = 15            # Zone claims > 3× historical baseline
FRS_MAX_SCORE = 100

# ─── Gate 1: Bouncer Thresholds ──────────────────────────────────────
POLICY_WAITING_PERIOD_HOURS = 48   # First-time policies must be 48hrs old

# ─── Redis Configuration ─────────────────────────────────────────────
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", "6379"))
REDIS_DB = 0
REDIS_CLAIM_PREFIX = "frs:claim:"   # Key prefix for claim hashes
REDIS_CLAIM_TTL_SECONDS = 86400    # 24 hours — claims expire after this

# ─── Gate 2: Velocity Thresholds ─────────────────────────────────────
MAX_SPEED_KM_PER_MIN = 1.5        # >1.5 km/min = impossible for delivery bike
EARTH_RADIUS_KM = 6371.0          # For Haversine calculation

# ─── Gate 3: Outlier Thresholds ──────────────────────────────────────
EARNINGS_SPIKE_THRESHOLD = 3.0     # 3× above 14-day avg = earnings inflation
ACTIVITY_SPIKE_HIGH = 3.0          # Delivery spike ratio for high flag
ACTIVITY_SPIKE_MED = 1.5           # Delivery spike ratio for medium flag

# ─── Gate 4: Network Thresholds ──────────────────────────────────────
MIN_CLUSTER_SIZE = 5               # Min workers in cluster to flag
CLUSTER_TIME_WINDOW_MINUTES = 5    # Claims within this window = suspicious
GPS_CO_LOCATION_METERS = 50        # Proximity threshold for co-location

# ─── FRS Decision Bands ──────────────────────────────────────────────
AUTO_APPROVE_MAX = 30              # 0-30: full payout
PARTIAL_HOLD_MAX = 65              # 31-65: 90% released, 10% held
# 66-100: full withhold + manual review

# ─── Payment Decision Labels ─────────────────────────────────────────
DECISION_AUTO_APPROVE = "AUTO_APPROVE"
DECISION_PARTIAL_HOLD = "PARTIAL_HOLD"
DECISION_FULL_WITHHOLD = "FULL_WITHHOLD"
