# AI/ML Integration Plan

> **Author:** Member 4  
> **Scope:** Premium Calculation · Risk Analysis · Fraud Detection  
> **Persona:** Zomato / Swiggy Food Delivery Partners  
> **Cross-references:** [README.md](../README.md) · [insurancemodel.md](./insurancemodel.md) · [triggers.md](./triggers.md)

---

## 1. AI Systems Overview

| AI System | Model Type | Purpose |
| --- | --- | --- |
| Risk Assessment AI | XGBoost classifier | Assigns risk tier (1/2/3) at onboarding and weekly renewal. Tier controls premium + payout caps + which scenarios are covered. |
| Income Proxy Model | Ridge Regression | Predicts hourly income for new workers (<14 days of earnings data). Replaced by formula once 14-day data is available. |
| Fraud Detection AI | FRS pipeline (F1–F5) | Scores every payout candidate 0–100 before funds are released. Five parallel signals computed within 1–2 minutes. |

> **Golden rule:** ML models produce scored inputs. Rules make every payment decision. No ML model releases money independently.

---

## 2. Risk Assessment AI

### 2.1 Inputs

| Input Signal | Source | Why It Matters |
| --- | --- | --- |
| `zone_flood_index` | 5-year IMD historical data per zone | Flood exposure of the worker's zone |
| `city_tier` | Worker registration zone mapping | Tier-1 cities have higher disruption frequency |
| `zone_disruption_history_5yr` | Historical event log | Count of curfews, weather events, traffic incidents |
| `curfew_frequency_annual` | Government advisory records per district | Determines if worker needs Tier 2/3 curfew coverage |
| `zone_aqi_annual_avg` | CPCB historical AQI per zone | Frequency of hazardous AQI days |
| `zone_traffic_disruption_freq` | Traffic API historical patterns | Festival / road closure frequency |
| `worker_shift_timing_mode` | Worker onboarding declaration | Peak-hour workers have higher exposure |
| `worker_delivery_radius_avg_km` | Platform activity records | Wider radius = more zone exposure |

### 2.2 Output

| Output Variable | Value | Effect |
| --- | --- | --- |
| `risk_tier_prediction` | 1 / 2 / 3 | Tier 1 = Standard (₹79/wk), Tier 2 = Elevated (₹129/wk), Tier 3 = High Risk (₹179/wk) |
| `confidence_score` | 0.0 – 1.0 | If confidence < 0.75 → defaults to next higher tier (conservative fallback) |

### 2.3 When It Runs

| Trigger | Action |
| --- | --- |
| Onboarding | Reads 8 inputs → assigns initial tier |
| Every 7-day renewal | Re-runs with fresh zone data + worker's prior-week activity → confirms or recommends tier change. Worker must confirm a downgrade — never applied silently. |
| New worker payout (<14 days) | Regression model predicts hourly income from `city_tier + delivery_segment + zone_id + shift_timing_mode + delivery_radius_avg_km`. Replaced by formula (`avg_earnings_14d ÷ avg_hours_14d`) once 14 days of data exist. |

### 2.4 Coverage Mapping — 5 Scenarios

The tier the model assigns directly controls which scenarios are covered. Under-classifying a worker = no payout when the event fires.

| Scenario | Tier 1 | Tier 2 | Tier 3 | Severity Factor |
| --- | :---: | :---: | :---: | ---: |
| UPI Server Crash | ✓ | ✓ | ✓ | 1.00 |
| Extreme Weather (Rain / AQI) | ✓ | ✓ | ✓ | 1.00 / 0.80 |
| Food Delivery Platform Outage | ✓ | ✓ | ✓ | 1.00 |
| Curfew / Section 144 | — | ✓ | ✓ | 1.20 |
| Festival Traffic / Road Closure | — | ✓ | ✓ | 0.50 |

---

## 3. Fraud Detection AI — FRS Pipeline

### 3.1 FRS Signals: Inputs, Logic, Score

| ID | Signal | Inputs | Detection Logic | FRS Impact |
| --- | --- | --- | --- | :---: |
| F1 | GPS Spoofing | `worker_gps_history` (last 10 pings), `worker_delivery_route_history` | Haversine velocity between consecutive pings. If distance ÷ time > 1.5 km/min → impossible speed → flagged. Secondary: GPS trajectory vs assigned delivery routes. | +35 pts |
| F2 | Earnings Inflation | `avg_earnings_14d`, `avg_earnings_4wk_prior`, `zone_90th_percentile` | If `avg_earnings_14d > avg_earnings_4wk × 1.40` → payout calc uses prior 4wk avg (not inflated 14d) → hard cap at zone 90th percentile. | +20 pts |
| F3 | Activity Gaming | `deliveries_24hr_before_event`, `rolling_avg_deliveries_24hr` | `spike_ratio = deliveries_24hr ÷ rolling_avg_24hr`. Ratio > 2.0 → +25 pts. Ratio > 1.5 → +12 pts. Catches workers padding deliveries to clear G3 gate. | +25 pts |
| F4 | Duplicate Claim | `worker_id`, `event_type`, `event_start_timestamp` | `hash = SHA-256(worker_id + event_type + epoch_rounded)`. Redis SETNX check before every payout write. If hash exists → duplicate → FRS = 100. Hard stop. | FRS = 100 |
| F5 | Group Fraud | `device_id`, `UPI_id`, `gps_co_location`, `claim_timestamps` | Pre-computed weekly graph: workers linked if they share `device_id`/`UPI_id` or are within 50m consistently. If ≥5 workers from same cluster file same event within 5 min → +20 to entire cluster's FRS. | +20 pts |

### 3.2 FRS Aggregation

```
frs_score = F1 + F2 + F3 + F5 + zone_anomaly_bonus (+15 if zone claims > 3× historical baseline)
          capped at 100

EXCEPTION: if F4 fires (duplicate hash) → frs_score = 100 immediately. F1–F3, F5 not computed.
```

### 3.3 FRS → Payment Decision

| FRS Score | Decision | Action |
| --- | --- | --- |
| 0 – 30 | AUTO-APPROVE | Full payout released via UPI immediately. No hold. |
| 31 – 65 | PARTIAL HOLD | 90% released immediately. 10% held for 24-hour automated review. Released if review passes. |
| 66 – 100 | FULL WITHHOLD | Entire payout held. Worker notified within 10 min with specific reason. Manual review within 48 hours. |

### 3.4 Primary Fraud Risk per Scenario

| Scenario | Primary Fraud Signal | Why |
| --- | --- | --- |
| UPI Server Crash | F1 + G5 gate | Worker must have active platform session — not just a GPS coordinate. GPS alone can be faked. |
| Extreme Weather | F3 | Workers spike deliveries the day before a forecast rainstorm to clear the 18-delivery G3 gate. |
| Platform Outage | F2 + F4 | Highest-frequency trigger. F2 prevents earnings inflation before high-volume events. F4 prevents double-claiming the same outage. |
| Curfew / Section 144 | F1 | Curfew boundaries are polygon-mapped. Worker GPS must be inside the restricted district polygon — proximity is not enough. |
| Festival Traffic / Road Closure | F5 | Festival zones are predictable days ahead. Linked-account clusters can coordinate claims. F5 graph catches this at filing time. |

---

## 4. ML vs Rules — Engineering Boundary

| Component | Approach | Reason |
| --- | --- | --- |
| Risk tier classification | XGBoost | 8 interacting variables; manual thresholds cannot capture zone+city+shift combinations at scale |
| Weekly tier re-evaluation | XGBoost | Same model, re-run with fresh zone data + prior-week worker activity |
| Income proxy for new workers | Regression | City / zone / segment combinations cannot be hardcoded |
| GPS velocity anomaly (F1) | AI-assisted rule | Physics calc on GPS history sequence; feeds into FRS rule |
| Group fraud graph clustering (F5) | AI Graph | Cross-account relationship patterns not detectable by per-worker rules |
| Earnings inflation check (F2) | Rule only | Simple % threshold on two known historical values |
| Duplicate claim check (F4) | Rule only | Deterministic hash lookup — no probabilistic element |
| Parametric trigger detection | Rule only | Must be 100% deterministic for insurance compliance |
| Eligibility gates G1–G5 | Rule only | Binary pass/fail on verified data |
| Final payment decision | Rule only | Hard FRS thresholds — no ML model releases money independently |

---

## 5. AI/ML System Architecture — Unified Risk and Fraud Engine

Our platform operates on a **dual-engine AI architecture** to handle both the issuance of policies and the processing of claims.

- **Phase 1 (Pre-Purchase):** The Risk & Pricing Engine evaluates the operating environment to assign a risk tier before a rider buys a policy.
- **Phase 2 (Post-Claim):** The Fraud Risk Score (FRS) Engine evaluates the legitimacy of a claim after a disruption occurs.

By splitting the architecture this way, we can dynamically price weekly policies and confidently automate payouts within a 10-minute SLA, removing the need for manual human review.

> *Think of it like a modern car. The Pricing AI is the engine — it determines how much power you need (calculating risk and cost). The Fraud Detection AI is the anti-lock braking and sensor system — it makes sure you don't crash (stopping fake claims). They use different math, but they run inside the exact same vehicle.*

### Phase 1 — Risk & Pricing Engine (Pre-Policy)

**Objective:** Assign riders to Tier 1, Tier 2, or Tier 3 pricing based on environmental data.

Traditional ZIP codes aren't granular enough to track weather or traffic accurately. Instead, we use **H3 Hexagonal Grids**, dividing the city into spatial zones of roughly 1–2 km².

The Gradient Boosting model is trained on historical datasets to identify risk patterns. For any given hexagon, the model ingests three primary data streams:

1. **Historical Data** — Frequencies of flooding or power outages in this specific hex over the last 5 years.
2. **Live Environment** — Current seasonal risks (e.g., monsoon season heavily weights the risk output).
3. **Rider Habits** — Operating windows (e.g., the 7–11 PM dinner rush carries a different risk profile than morning shifts).

The model generates a Risk Score from 0–100 for the rider's upcoming week:

| Score | Tier | Weekly Premium |
| --- | --- | --- |
| Low (safe zone, clear weather) | Tier 1 | ₹79/week |
| Medium | Tier 2 | ₹129/week |
| High (flood-prone, monsoon) | Tier 3 | ₹179/week |

### Phase 2 — FRS Engine (Post-Trigger, Pre-Payout)

**Objective:** Automatically score payout requests (0–100) to intercept fraudulent claims before initiating the bank transfer.

To maintain our 10-minute payout guarantee, we use a **4-stage layered fraud detection pipeline**. A claim must clear all four gates.

| Gate | Name | Mechanism |
| --- | --- | --- |
| Gate 1 | The Bouncer (Rule-Based Filters) | Fast, deterministic logic. Rejects policies < 48 hours old. Hashes claims to block duplicates immediately. |
| Gate 2 | The Speed Camera (Geospatial Velocity AI) | Calculates distance and time delta between GPS pings. Flags teleportation or impossible speeds (e.g., 120 km/h in a known traffic jam). |
| Gate 3 | The Outlier Detector (Isolation Forest) | Detects earning curve anomalies. An illogical 40% earning spike in 48 hours is flagged as artificial inflation. |
| Gate 4 | The Network Mapper (Group Collusion AI) | Plots incoming claims spatially and temporally. Clusters of identical claims from the same location at the same moment are frozen for review. |

If a claim clears all four gates, the resulting FRS score remains low (e.g., 15/100) and the system automatically triggers an immediate UPI transfer with no human review.
