# 🛡️ FRS Engine — Fraud Risk Score Documentation

## AI & Fraud Prevention Engine for Parametric Income Protection

A FastAPI microservice implementing a **4-gate fraud detection pipeline** that scores every payout claim **0–100** and makes an automated payment decision.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Setup & Installation](#setup--installation)
- [Running with Docker Compose](#running-with-docker-compose)
- [API Endpoints](#api-endpoints)
- [Gate 1 — The Bouncer](#gate-1--the-bouncer-rule-based-filters)
- [Gate 2 — The Speed Camera](#gate-2--the-speed-camera-gps-velocity-ai)
- [Gate 3 — The Outlier Detector](#gate-3--the-outlier-detector-earnings--activity-ai)
- [Gate 4 — The Network Mapper](#gate-4--the-network-mapper-group-collusion-ai)
- [Full Pipeline Test](#full-pipeline-test)
- [Batch Endpoint — verify-claims](#batch-endpoint--verify-claims)
- [Decision Bands](#decision-bands)

---

## Architecture Overview

```
                         ┌──────────────────────────────────────┐
                         │          FRS Engine (FastAPI)         │
  Go Backend             │                                      │
  POST /verify-claims ──►│  Gate 1 ─► Gate 2 ─► Gate 3 ─► Gate 4│──► FRS Score + Decision
                         │  Bouncer   Speed    Outlier   Network │
                         │  (Redis)   Camera   Detector  Mapper  │
                         └──────────────┬───────────────────────┘
                                        │
                                   Redis (Docker)
                                   Duplicate Hashes
```

**FRS Formula:** `FRS = F1 + F2 + F3 + F5 + zone_anomaly_bonus` (capped at 100)

| Gate | Code | What it Detects | FRS Points |
|------|------|-----------------|------------|
| Gate 1 | F4 | Duplicate claims + Policy age violation | 100 (hard stop) |
| Gate 2 | F1 | GPS spoofing (impossible speed) | +85 |
| Gate 3 | F2 | Earnings inflation (3× normal) | +60 |
| Gate 3 | F3 | Activity gaming (delivery spike) | +25 or +12 |
| Gate 4 | F5 | Group collusion (shared device/UPI/GPS) | +20 |
| Bonus | — | Zone anomaly (3× historical claims) | +15 |

---

## Setup & Installation

### Prerequisites
- Python 3.11+
- Docker (for Redis)

### Step 1: Create Virtual Environment

```bash
cd fraud-detection-engine
python -m venv venv
```

### Step 2: Activate Virtual Environment

```bash
# Windows PowerShell
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Start Redis in Docker

```bash
docker run -d -p 6379:6379 --name frs-redis redis
```

### Step 5: Run the FRS Engine

```bash
uvicorn main:app --reload --port 8000
```

### Step 6: Open Swagger UI

Navigate to **http://localhost:8000/docs** in your browser.

---

## Running with Docker Compose

Docker Compose starts **both Redis and the FRS Engine** with a single command.

### Start Everything

```bash
cd fraud-detection-engine
docker-compose up --build
```

### Stop Everything

```bash
docker-compose down
```

### What It Starts

| Service | Port | Description |
|---------|------|-------------|
| `redis` | 6379 | Redis 7 Alpine — stores duplicate claim hashes |
| `frs-engine` | 8000 | FastAPI FRS Engine — the fraud detection service |

After starting, open **http://localhost:8000/docs** for the Swagger UI.

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/health` | Health check — shows active gates |
| `POST` | `/api/v1/fraud/gate/1` | Test Gate 1 individually |
| `POST` | `/api/v1/fraud/gate/2` | Test Gate 2 individually |
| `POST` | `/api/v1/fraud/gate/3` | Test Gate 3 individually |
| `POST` | `/api/v1/fraud/gate/4` | Test Gate 4 individually (batch input) |
| `POST` | `/api/v1/fraud/score` | Full pipeline — single claim through all gates |
| `POST` | `/verify-claims` | Batch endpoint — multiple claims (Go backend integration) |
| `POST` | `/api/v1/admin/reset-claims` | Reset Redis claim store (for testing) |

---

## Gate 1 — The Bouncer (Rule-Based Filters)

**Endpoint:** `POST /api/v1/fraud/gate/1`

**What it checks:**
1. **F4 — Duplicate Claim Detection:** SHA-256 hash of `(worker_id + event_type + epoch_hour)` stored in Redis. If it already exists → FRS = 100 (hard stop).
2. **48-Hour Policy Age Check:** First-time policies must be ≥ 48 hours old. Renewals are exempt.

### Test Case 1: Clean Claim (should PASS)

```json
{
  "worker": {
    "worker_id": "WKR-001-RAJU",
    "device_id": "DEV-001",
    "upi_id": "raju@upi",
    "gps_history": [
      {"latitude": 28.5500, "longitude": 77.2500, "timestamp": "2026-04-02T07:00:00"},
      {"latitude": 28.5510, "longitude": 77.2510, "timestamp": "2026-04-02T07:05:00"}
    ]
  },
  "policy": {
    "policy_start_time": "2026-03-30T10:00:00",
    "is_renewal": false
  },
  "event_type": "heavy_rain",
  "event_timestamp": "2026-04-02T07:30:00"
}
```

**Expected:** FRS = 0, AUTO_APPROVE
**Why:** No duplicate exists, policy is 3 days old (passes 48-hour check).

---

### Test Case 2: Duplicate Claim (submit Test Case 1 again without resetting)

Submit the **exact same JSON** from Test Case 1 a second time.

**Expected:** FRS = 100, FULL_WITHHOLD
**Why:** The SHA-256 hash of `(WKR-001-RAJU + heavy_rain + epoch_hour)` already exists in Redis from the first submission.

> **Reset between tests:** Use `POST /api/v1/admin/reset-claims` to clear Redis.

---

### Test Case 3: Policy Too New (should FAIL)

```json
{
  "worker": {
    "worker_id": "WKR-NEW-BUYER",
    "gps_history": [
      {"latitude": 28.5500, "longitude": 77.2500, "timestamp": "2026-04-02T07:00:00"},
      {"latitude": 28.5510, "longitude": 77.2510, "timestamp": "2026-04-02T07:05:00"}
    ]
  },
  "policy": {
    "policy_start_time": "2026-04-01T20:00:00",
    "is_renewal": false
  },
  "event_type": "curfew",
  "event_timestamp": "2026-04-02T07:30:00"
}
```

**Expected:** FRS = 100, FULL_WITHHOLD
**Why:** Policy is only ~11 hours old. First-time policies require 48 hours before claims are eligible.

---

### Test Case 4: Renewal Exemption (should PASS)

```json
{
  "worker": {
    "worker_id": "WKR-ARJUN-RENEW",
    "gps_history": [
      {"latitude": 28.5500, "longitude": 77.2500, "timestamp": "2026-04-02T07:00:00"},
      {"latitude": 28.5510, "longitude": 77.2510, "timestamp": "2026-04-02T07:05:00"}
    ]
  },
  "policy": {
    "policy_start_time": "2026-04-01T20:00:00",
    "is_renewal": true
  },
  "event_type": "heavy_rain",
  "event_timestamp": "2026-04-02T07:30:00"
}
```

**Expected:** FRS = 0, AUTO_APPROVE
**Why:** Even though the policy is only 11 hours old, it's a **renewal** — renewals are exempt from the 48-hour waiting period because they carry trust from the prior cycle.

---

## Gate 2 — The Speed Camera (GPS Velocity AI)

**Endpoint:** `POST /api/v1/fraud/gate/2`

**What it checks:**
- **F1 — GPS Velocity Anomaly:** Calculates Haversine distance ÷ time between consecutive GPS pings. If speed > 90 km/hr (1.5 km/min) → +85 FRS.
- A delivery rider on a bike cannot travel faster than 90 km/hr in an urban area. If they do, their GPS is being spoofed.

### Test Case 5: GPS Spoofing Detected (should FAIL)

```json
{
  "worker": {
    "worker_id": "WKR-SPOOF-01",
    "device_id": "DEV-SPOOF",
    "upi_id": "spoof@upi",
    "gps_history": [
      {"latitude": 28.5500, "longitude": 77.2500, "timestamp": "2026-04-02T07:00:00"},
      {"latitude": 28.5510, "longitude": 77.2510, "timestamp": "2026-04-02T07:05:00"},
      {"latitude": 28.6500, "longitude": 77.3500, "timestamp": "2026-04-02T07:06:00"}
    ]
  },
  "policy": {
    "policy_start_time": "2026-03-30T10:00:00",
    "is_renewal": false
  },
  "event_type": "heavy_rain",
  "event_timestamp": "2026-04-02T07:30:00"
}
```

**Expected:** FRS = 85, FULL_WITHHOLD
**Why:** Between the 2nd and 3rd GPS ping, the worker "moved" ~14.6 km in 1 minute = **878 km/hr**. That's impossible on a delivery bike — GPS is being spoofed.

---

### Test Case 6: Normal Movement (should PASS)

```json
{
  "worker": {
    "worker_id": "WKR-NORMAL-01",
    "device_id": "DEV-NORMAL",
    "upi_id": "normal@upi",
    "gps_history": [
      {"latitude": 28.5500, "longitude": 77.2500, "timestamp": "2026-04-02T07:00:00"},
      {"latitude": 28.5510, "longitude": 77.2510, "timestamp": "2026-04-02T07:05:00"},
      {"latitude": 28.5520, "longitude": 77.2520, "timestamp": "2026-04-02T07:10:00"}
    ]
  },
  "policy": {
    "policy_start_time": "2026-03-30T10:00:00",
    "is_renewal": false
  },
  "event_type": "heavy_rain",
  "event_timestamp": "2026-04-02T07:30:00"
}
```

**Expected:** FRS = 0, AUTO_APPROVE
**Why:** Movement between pings is ~0.15 km over 5 minutes = ~1.8 km/hr. That's normal walking/biking speed.

---

## Gate 3 — The Outlier Detector (Earnings & Activity AI)

**Endpoint:** `POST /api/v1/fraud/gate/3`

**What it checks:**
1. **F2 — Earnings Inflation:** Compares 14-day avg earnings with 4-week avg. If 14-day is ≥ 3× the 4-week avg → +60 FRS.
2. **F3 — Activity Gaming:** Compares deliveries in 24hr before the event with rolling average. If spike ≥ 3× → +25 FRS. If spike ≥ 1.5× → +12 FRS.

### Test Case 7: Earnings Inflation (should FAIL — +60 FRS)

```json
{
  "worker": {
    "worker_id": "WKR-INFLATOR-01",
    "avg_earnings_14d": 1500,
    "avg_earnings_4wk": 400,
    "zone_90th_percentile": 800,
    "deliveries_24hr_before_event": 8,
    "rolling_avg_deliveries_24hr": 7
  },
  "policy": {
    "policy_start_time": "2026-03-28T10:00:00",
    "is_renewal": false
  },
  "event_type": "heavy_rain",
  "event_timestamp": "2026-04-02T08:00:00"
}
```

**Expected:** FRS = 60, PARTIAL_HOLD
**Why:** 14-day avg (₹1500) is **3.75×** the 4-week avg (₹400). Threshold is 3×. The rider is artificially inflating earnings before claiming. Activity is normal (8 vs avg 7).

---

### Test Case 8: Activity Gaming (should FAIL — +25 FRS)

```json
{
  "worker": {
    "worker_id": "WKR-GAMER-01",
    "avg_earnings_14d": 500,
    "avg_earnings_4wk": 450,
    "deliveries_24hr_before_event": 30,
    "rolling_avg_deliveries_24hr": 8
  },
  "policy": {
    "policy_start_time": "2026-03-28T10:00:00",
    "is_renewal": false
  },
  "event_type": "curfew",
  "event_timestamp": "2026-04-02T08:00:00"
}
```

**Expected:** FRS = 25, AUTO_APPROVE
**Why:** 30 deliveries in 24hr before event vs rolling avg of 8 = **3.75× spike**. The rider pumped deliveries to inflate the payout amount. Earnings are normal (₹500 vs ₹450).

---

### Test Case 9: Both Earnings + Activity Fraud (should FAIL — +85 FRS)

```json
{
  "worker": {
    "worker_id": "WKR-DOUBLE-FRAUD",
    "avg_earnings_14d": 2000,
    "avg_earnings_4wk": 500,
    "zone_90th_percentile": 800,
    "deliveries_24hr_before_event": 30,
    "rolling_avg_deliveries_24hr": 8
  },
  "policy": {
    "policy_start_time": "2026-03-28T10:00:00",
    "is_renewal": false
  },
  "event_type": "heavy_rain",
  "event_timestamp": "2026-04-02T08:00:00"
}
```

**Expected:** FRS = 85, FULL_WITHHOLD
**Why:** Earnings 4× normal (+60) AND activity 3.75× normal (+25) = 85 total.

---

### Test Case 10: Clean Worker (should PASS)

```json
{
  "worker": {
    "worker_id": "WKR-CLEAN-01",
    "avg_earnings_14d": 500,
    "avg_earnings_4wk": 480,
    "deliveries_24hr_before_event": 8,
    "rolling_avg_deliveries_24hr": 7
  },
  "policy": {
    "policy_start_time": "2026-03-28T10:00:00",
    "is_renewal": false
  },
  "event_type": "heavy_rain",
  "event_timestamp": "2026-04-02T08:00:00"
}
```

**Expected:** FRS = 0, AUTO_APPROVE
**Why:** Earnings ratio is 1.0× (normal), activity ratio is 1.1× (normal). Nothing suspicious.

---

## Gate 4 — The Network Mapper (Group Collusion AI)

**Endpoint:** `POST /api/v1/fraud/gate/4`

> **Important:** Gate 4 takes a **batch of workers** (not a single claim), because collusion is about relationships between workers.

**What it checks:**
1. **Shared Device ID** — Multiple worker accounts on the same phone
2. **Shared UPI ID** — Multiple accounts paying to the same bank account
3. **GPS Co-Location** — Workers within 50 meters of each other

If a cluster of **≥ 5 workers** share any signal → **+20 FRS** per worker.

### Test Case 11: Fraud Ring Detected (should FAIL — 5 workers flagged)

```json
{
  "workers": [
    {"worker_id": "FAKE-01", "device_id": "PHONE-X", "upi_id": "boss@upi", "latitude": 28.5500, "longitude": 77.2500},
    {"worker_id": "FAKE-02", "device_id": "PHONE-X", "upi_id": "boss@upi", "latitude": 28.5500, "longitude": 77.2500},
    {"worker_id": "FAKE-03", "device_id": "PHONE-X", "upi_id": "boss@upi", "latitude": 28.5501, "longitude": 77.2501},
    {"worker_id": "FAKE-04", "device_id": "PHONE-X", "upi_id": "boss@upi", "latitude": 28.5500, "longitude": 77.2500},
    {"worker_id": "FAKE-05", "device_id": "PHONE-X", "upi_id": "boss@upi", "latitude": 28.5500, "longitude": 77.2500},
    {"worker_id": "LEGIT-01", "device_id": "PHONE-Y", "upi_id": "legit@upi", "latitude": 12.9700, "longitude": 77.5900}
  ],
  "event_type": "heavy_rain",
  "event_timestamp": "2026-04-02T08:00:00"
}
```

**Expected:**
- 5 FAKE workers → flagged with `GROUP FRAUD DETECTED`, +20 FRS each
- LEGIT-01 → NOT flagged (different device, UPI, and city)
- Device cluster: `PHONE-X` → 5 workers
- UPI cluster: `boss@upi` → 5 workers
- GPS cluster: all 5 FAKE workers within 50m

---

### Test Case 12: Suspicious but Below Threshold (should MONITOR, no penalty)

```json
{
  "workers": [
    {"worker_id": "SUS-01", "device_id": "PHONE-Z", "upi_id": "sus@upi", "latitude": 28.5500, "longitude": 77.2500},
    {"worker_id": "SUS-02", "device_id": "PHONE-Z", "upi_id": "sus@upi", "latitude": 28.5500, "longitude": 77.2500},
    {"worker_id": "SUS-03", "device_id": "PHONE-Z", "upi_id": "sus@upi", "latitude": 28.5500, "longitude": 77.2500}
  ],
  "event_type": "curfew",
  "event_timestamp": "2026-04-02T08:00:00"
}
```

**Expected:** FRS = 0 for each worker
**Why:** Cluster size is 3 (below threshold of 5). Shows `SUSPICIOUS LINKS` but no FRS penalty. System monitors but doesn't punish yet.

---

### Test Case 13: All Legitimate Workers (should PASS)

```json
{
  "workers": [
    {"worker_id": "RAJU", "device_id": "DEV-R", "upi_id": "raju@upi", "latitude": 28.5500, "longitude": 77.2500},
    {"worker_id": "MEENA", "device_id": "DEV-M", "upi_id": "meena@upi", "latitude": 28.6000, "longitude": 77.3000},
    {"worker_id": "ARJUN", "device_id": "DEV-A", "upi_id": "arjun@upi", "latitude": 12.9700, "longitude": 77.5900}
  ],
  "event_type": "heavy_rain",
  "event_timestamp": "2026-04-02T08:00:00"
}
```

**Expected:** FRS = 0 for all, no flags
**Why:** Every worker has a unique device, unique UPI, and different GPS locations. No collusion signals.

---

## Full Pipeline Test

**Endpoint:** `POST /api/v1/fraud/score`

This runs a single claim through **all 4 gates sequentially**. Gate 4 is skipped for single claims (it needs batch context).

> **Remember:** Reset claims before each test using `POST /api/v1/admin/reset-claims`

### Test Case 14: Clean Claim Through Full Pipeline

```json
{
  "worker": {
    "worker_id": "RAJU-FULL-TEST",
    "device_id": "DEV-R1",
    "upi_id": "raju@upi",
    "gps_history": [
      {"latitude": 28.5500, "longitude": 77.2500, "timestamp": "2026-04-02T08:50:00"},
      {"latitude": 28.5510, "longitude": 77.2510, "timestamp": "2026-04-02T08:55:00"}
    ],
    "avg_earnings_14d": 500,
    "avg_earnings_4wk": 480,
    "deliveries_24hr_before_event": 8,
    "rolling_avg_deliveries_24hr": 7
  },
  "policy": {
    "policy_start_time": "2026-03-28T10:00:00",
    "is_renewal": false
  },
  "event_type": "heavy_rain",
  "event_timestamp": "2026-04-02T09:00:00"
}
```

**Expected:** FRS = 0, AUTO_APPROVE — passes all gates cleanly.

---

### Test Case 15: GPS Spoofer Caught at Gate 2

```json
{
  "worker": {
    "worker_id": "VIK-GPS-SPOOF",
    "device_id": "DEV-V1",
    "upi_id": "vik@upi",
    "gps_history": [
      {"latitude": 28.5500, "longitude": 77.2500, "timestamp": "2026-04-02T08:50:00"},
      {"latitude": 28.5510, "longitude": 77.2510, "timestamp": "2026-04-02T08:55:00"},
      {"latitude": 28.6500, "longitude": 77.3500, "timestamp": "2026-04-02T08:56:00"}
    ],
    "avg_earnings_14d": 500,
    "avg_earnings_4wk": 480,
    "deliveries_24hr_before_event": 8,
    "rolling_avg_deliveries_24hr": 7
  },
  "policy": {
    "policy_start_time": "2026-03-28T10:00:00",
    "is_renewal": true
  },
  "event_type": "heavy_rain",
  "event_timestamp": "2026-04-02T09:00:00"
}
```

**Expected:** FRS = 85, FULL_WITHHOLD
**Why:** Gate 1 passes (renewal, no duplicate). Gate 2 catches GPS teleport (878 km/hr). Gate 3 passes (normal earnings/activity).

---

## Batch Endpoint — verify-claims

**Endpoint:** `POST /verify-claims`

This is the **main production endpoint** called by the Go backend. It processes multiple workers in a single request and runs all 4 gates (including Gate 4 with full batch context).

> **Reset claims before testing:** `POST /api/v1/admin/reset-claims`

### Test Case 16: Complex Batch — All Gates Fire

This batch contains 9 workers designed to trigger every gate:

```json
{
  "claims": [
    {
      "worker_id": "RAJU-CLEAN",
      "device_id": "DEV-R1",
      "upi_id": "raju@upi",
      "event_type": "heavy_rain",
      "event_timestamp": "2026-04-02T09:00:00",
      "policy_start_time": "2026-03-28T10:00:00",
      "is_renewal": false,
      "gps_history": [
        {"latitude": 28.5500, "longitude": 77.2500, "timestamp": "2026-04-02T08:50:00"},
        {"latitude": 28.5510, "longitude": 77.2510, "timestamp": "2026-04-02T08:55:00"}
      ],
      "avg_earnings_14d": 500,
      "avg_earnings_4wk": 480,
      "deliveries_24hr_before_event": 8,
      "rolling_avg_deliveries_24hr": 7
    },
    {
      "worker_id": "MEENA-NEWPOLICY",
      "device_id": "DEV-M1",
      "upi_id": "meena@upi",
      "event_type": "heavy_rain",
      "event_timestamp": "2026-04-02T09:00:00",
      "policy_start_time": "2026-04-02T07:00:00",
      "is_renewal": false,
      "gps_history": [
        {"latitude": 12.9700, "longitude": 77.5900, "timestamp": "2026-04-02T08:50:00"},
        {"latitude": 12.9710, "longitude": 77.5910, "timestamp": "2026-04-02T08:55:00"}
      ],
      "avg_earnings_14d": 400,
      "avg_earnings_4wk": 420,
      "deliveries_24hr_before_event": 6,
      "rolling_avg_deliveries_24hr": 7
    },
    {
      "worker_id": "SPOOFER-VIK",
      "device_id": "DEV-V1",
      "upi_id": "vik@upi",
      "event_type": "heavy_rain",
      "event_timestamp": "2026-04-02T09:00:00",
      "policy_start_time": "2026-03-28T10:00:00",
      "is_renewal": true,
      "gps_history": [
        {"latitude": 28.5500, "longitude": 77.2500, "timestamp": "2026-04-02T08:50:00"},
        {"latitude": 28.5510, "longitude": 77.2510, "timestamp": "2026-04-02T08:55:00"},
        {"latitude": 28.6500, "longitude": 77.3500, "timestamp": "2026-04-02T08:56:00"}
      ],
      "avg_earnings_14d": 600,
      "avg_earnings_4wk": 550,
      "deliveries_24hr_before_event": 10,
      "rolling_avg_deliveries_24hr": 9
    },
    {
      "worker_id": "INFLATOR-SURESH",
      "device_id": "DEV-S1",
      "upi_id": "suresh@upi",
      "event_type": "heavy_rain",
      "event_timestamp": "2026-04-02T09:00:00",
      "policy_start_time": "2026-03-28T10:00:00",
      "is_renewal": false,
      "gps_history": [
        {"latitude": 28.6000, "longitude": 77.2000, "timestamp": "2026-04-02T08:50:00"},
        {"latitude": 28.6010, "longitude": 77.2010, "timestamp": "2026-04-02T08:55:00"}
      ],
      "avg_earnings_14d": 2000,
      "avg_earnings_4wk": 500,
      "zone_90th_percentile": 800,
      "deliveries_24hr_before_event": 30,
      "rolling_avg_deliveries_24hr": 8
    },
    {
      "worker_id": "RING-01",
      "device_id": "GANG-PHONE",
      "upi_id": "gang-boss@upi",
      "event_type": "heavy_rain",
      "event_timestamp": "2026-04-02T09:00:00",
      "policy_start_time": "2026-03-28T10:00:00",
      "is_renewal": true,
      "gps_history": [
        {"latitude": 28.7000, "longitude": 77.1000, "timestamp": "2026-04-02T08:50:00"},
        {"latitude": 28.7001, "longitude": 77.1001, "timestamp": "2026-04-02T08:55:00"}
      ],
      "avg_earnings_14d": 450,
      "avg_earnings_4wk": 430,
      "deliveries_24hr_before_event": 7,
      "rolling_avg_deliveries_24hr": 7
    },
    {
      "worker_id": "RING-02",
      "device_id": "GANG-PHONE",
      "upi_id": "gang-boss@upi",
      "event_type": "heavy_rain",
      "event_timestamp": "2026-04-02T09:00:00",
      "policy_start_time": "2026-03-28T10:00:00",
      "is_renewal": true,
      "gps_history": [
        {"latitude": 28.7000, "longitude": 77.1000, "timestamp": "2026-04-02T08:50:00"},
        {"latitude": 28.7001, "longitude": 77.1001, "timestamp": "2026-04-02T08:55:00"}
      ],
      "avg_earnings_14d": 460,
      "avg_earnings_4wk": 440,
      "deliveries_24hr_before_event": 8,
      "rolling_avg_deliveries_24hr": 7
    },
    {
      "worker_id": "RING-03",
      "device_id": "GANG-PHONE",
      "upi_id": "gang-boss@upi",
      "event_type": "heavy_rain",
      "event_timestamp": "2026-04-02T09:00:00",
      "policy_start_time": "2026-03-28T10:00:00",
      "is_renewal": true,
      "gps_history": [
        {"latitude": 28.7000, "longitude": 77.1000, "timestamp": "2026-04-02T08:50:00"},
        {"latitude": 28.7001, "longitude": 77.1001, "timestamp": "2026-04-02T08:55:00"}
      ],
      "avg_earnings_14d": 470,
      "avg_earnings_4wk": 450,
      "deliveries_24hr_before_event": 7,
      "rolling_avg_deliveries_24hr": 7
    },
    {
      "worker_id": "RING-04",
      "device_id": "GANG-PHONE",
      "upi_id": "gang-boss@upi",
      "event_type": "heavy_rain",
      "event_timestamp": "2026-04-02T09:00:00",
      "policy_start_time": "2026-03-28T10:00:00",
      "is_renewal": true,
      "gps_history": [
        {"latitude": 28.7000, "longitude": 77.1000, "timestamp": "2026-04-02T08:50:00"},
        {"latitude": 28.7001, "longitude": 77.1001, "timestamp": "2026-04-02T08:55:00"}
      ],
      "avg_earnings_14d": 480,
      "avg_earnings_4wk": 460,
      "deliveries_24hr_before_event": 8,
      "rolling_avg_deliveries_24hr": 7
    },
    {
      "worker_id": "RING-05",
      "device_id": "GANG-PHONE",
      "upi_id": "gang-boss@upi",
      "event_type": "heavy_rain",
      "event_timestamp": "2026-04-02T09:00:00",
      "policy_start_time": "2026-03-28T10:00:00",
      "is_renewal": true,
      "gps_history": [
        {"latitude": 28.7000, "longitude": 77.1000, "timestamp": "2026-04-02T08:50:00"},
        {"latitude": 28.7001, "longitude": 77.1001, "timestamp": "2026-04-02T08:55:00"}
      ],
      "avg_earnings_14d": 490,
      "avg_earnings_4wk": 470,
      "deliveries_24hr_before_event": 9,
      "rolling_avg_deliveries_24hr": 7
    }
  ],
  "zone_claims_count": 50,
  "zone_historical_baseline": 10
}
```

### Expected Batch Results

| Worker | Gate Triggered | FRS | Decision | Reason |
|--------|---------------|-----|----------|--------|
| RAJU-CLEAN | None (zone bonus only) | 15 | AUTO_APPROVE | Legit rider, +15 zone anomaly |
| MEENA-NEWPOLICY | Gate 1 (Policy Age) | 100 | FULL_WITHHOLD | Policy only 2 hours old |
| SPOOFER-VIK | Gate 2 (GPS Spoof) | 100 | FULL_WITHHOLD | 14km in 1 min = 878 km/hr |
| INFLATOR-SURESH | Gate 3 (Earnings+Activity) | 100 | FULL_WITHHOLD | Earnings 4× + Deliveries 3.75× |
| RING-01 to 05 | Gate 4 (Collusion) | 35 | PARTIAL_HOLD | Shared device + UPI + GPS + zone bonus |

### FRS Score Breakdown

- **RAJU:** 0 + 0 + 0 + 0 + 15(zone) = **15**
- **MEENA:** 100 (hard stop at Gate 1) — pipeline ends immediately
- **SPOOFER:** 0 + 85 + 0 + 0 + 15(zone) = 100 (capped)
- **INFLATOR:** 0 + 0 + 60(earnings) + 25(activity) + 15(zone) = 100 (capped)
- **RING workers:** 0 + 0 + 0 + 20(collusion) + 15(zone) = **35**

---

## Decision Bands

| FRS Score | Decision | Action |
|-----------|----------|--------|
| 0 – 30 | AUTO_APPROVE | Full UPI payout released in 10 minutes |
| 31 – 65 | PARTIAL_HOLD | 90% released immediately, 10% held for 24-hour review |
| 66 – 100 | FULL_WITHHOLD | Entire payout held, worker notified, manual review within 48 hours |

---

## Project Structure

```
fraud-detection-engine/
├── main.py                  # FastAPI app — all endpoints + pipeline orchestration
├── config.py                # All thresholds, FRS points, Redis config
├── requirements.txt         # Python dependencies
├── Dockerfile               # Container image for the FRS engine
├── docker-compose.yml       # One-command startup (Redis + FRS Engine)
├── .dockerignore            # Files excluded from Docker builds
├── mock_trigger.py          # Simulation script (optional)
├── models/
│   ├── __init__.py
│   └── schemas.py           # Pydantic models (ClaimRequest, FRSResult, etc.)
└── gates/
    ├── __init__.py
    ├── gate1_bouncer.py     # F4 Duplicate detection (Redis) + Policy age check
    ├── gate2_velocity.py    # F1 GPS spoofing (Haversine velocity)
    ├── gate3_outlier.py     # F2 Earnings inflation + F3 Activity gaming
    └── gate4_network.py     # F5 Group fraud (device/UPI/GPS clustering)
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Python 3.11** | Core language |
| **FastAPI** | REST API framework with auto-generated Swagger docs |
| **Pydantic** | Request/response validation and serialization |
| **Redis** | Duplicate claim hash storage (SETNX with TTL) |
| **Docker** | Containerization for Redis and the FRS Engine |
| **Haversine Formula** | GPS distance calculation for velocity analysis |
| **SHA-256** | Deterministic hashing for duplicate claim detection |
