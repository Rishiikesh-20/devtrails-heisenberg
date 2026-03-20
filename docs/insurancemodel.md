# Weekly Parametric Income Protection for Food Delivery Partners

> **Document type:** Pilot Product Model & Technical Insurance Specification  
> **Status:** Phase 1 Deliverable — Finalized  
> **Cross-references:** [README.md](../README.md) · [System Architecture](../Arch.png) · [Insurance Model DOCX](./originals/InsuranceModal.docx)  
> **Scope:** Income-loss cover only. Weekly pricing. Automated trigger and payout flow. No health, life, accident, or vehicle coverage.

---

## 1. Product Overview

This product is a weekly parametric income-protection layer for food delivery partners (Zomato/Swiggy personas). It is not traditional indemnity insurance.

Core proposition:
- No claim forms
- No manual assessor
- No waiting period for payout processing once eligible
- Data-triggered payout in 10 minutes

This product only covers short-term income interruption caused by external, verifiable disruptions. It does not replace health, disability, accident, life, or retirement/social-security benefits.

Hard constraints (non-negotiable):
- Income-loss cover only
- Weekly pricing cycle (7 days)
- Fully automated, data-driven trigger and payout flow

Distribution model:
- Embedded inside delivery partner apps (Zomato/Swiggy)
- Enrolment, renewal, payout visibility, and disputes handled in-app

## 2. Premium and Tier Model (Pilot Assumptions)

The pilot assumes three weekly plans:
- Tier 1: Rs 79/week
- Tier 2: Rs 129/week
- Tier 3: Rs 179/week

These are pilot design assumptions and not final actuarial tariffs. Final pricing requires formal actuarial validation before regulated launch.

### 2.1 Why these premium bands

- Typical earnings are approximately Rs 600 to Rs 1,200/day in Tier-1 city conditions.
- A weekly premium is roughly 1.5% to 2.5% of one day of earnings (directional affordability framing only).
- Max payout is around 11x to 14x weekly premium; pilot sustainability depends on claim frequency assumptions and reinsurance.
- Early-stage platform subsidy (illustrative Rs 15 to Rs 20 per worker per week) can improve adoption and retention.

### 2.2 Risk tier assignment

Risk scoring inputs:
- Delivery zone risk profile (flood-prone, congestion-heavy, disruption-prone areas)
- City class (Tier-1 cities generally exhibit higher disruption frequency)
- Five-year disruption history (weather, traffic, curfew, civil advisory patterns)
- Worker activity profile (shift timing, delivery radius, order density)

Tier refresh:
- Re-evaluated every renewal cycle (every 7 days)
- System may recommend downgrade after sustained lower risk (for example, 8+ consecutive low-disruption weeks)
- Tier changes are never applied silently; worker confirmation is required at renewal

### 2.3 Premium and coverage table

| Tier | Weekly Premium | Daily Payout Cap | Weekly Payout Cap | Max Qualifying Events/Week | Co-pay |
| --- | ---: | ---: | ---: | ---: | ---: |
| Tier 1 (Standard) | Rs 79 | Rs 420 | Rs 900 | 2 | 20% |
| Tier 2 (Elevated) | Rs 129 | Rs 700 | Rs 1,600 | 3 | 20% |
| Tier 3 (High Risk) | Rs 179 | Rs 1,000 | Rs 2,500 | 4 | 20% |

### 2.4 Tier coverage scope

- Tier 1: Heavy rain/flood, severe AQI, platform outage, fuel-supply disruption
- Tier 2: All Tier 1 + government curfew/Section 144 + severe traffic/road closure
- Tier 3: All Tier 2 + civil disruption/city bandh

## 3. Policy and Subscription Rules

- Premium is collected upfront for each 7-day cycle (UPI auto-debit or manual pay).
- Coverage starts immediately after successful payment and remains active for exactly 7 days.
- Auto-renew can be enabled by default; worker can switch to manual renewal.
- If renewal fails, policy lapses at cycle-end midnight (no grace period, no backdated cover).
- Mid-cycle cancellation: coverage remains active for paid period; no pro-rata refund.
- Zone change during week: current cycle unchanged; reassessment at next renewal.

Anti-timing abuse guard:
- 48-hour waiting period applies only to first-time activation.
- Renewals of active policies are exempt from this waiting period.

## 4. Covered Event Triggers

Event triggers are deterministic and recorded with source attribution for audit.

| Event Type | Trigger Condition | Minimum Duration | Data Source Type | Available From |
| --- | --- | --- | --- | --- |
| Heavy Rain/Flood | Rainfall > 15 mm/hr OR active flood alert in zone | 60 min | IMD / weather feed (or mock) | Tier 1 |
| Severe Air Pollution | AQI > 400 (hazardous) in worker zone | 60 min | CPCB AQI feed (or mock) | Tier 1 |
| Platform Outage | Orders drop > 70% below same-window rolling baseline while worker active | 30 min | Platform API / simulated dataset | Tier 1 |
| Fuel Supply Disruption | > 60% fuel stations closed within 5 km | 60 min | Fuel availability feed (or mock) | Tier 1 |
| Government Curfew / Sec 144 | Official movement restrictions | Any duration | Advisory/gazette feed (or mock) | Tier 2 |
| Severe Traffic / Road Closure | Primary routes blocked OR avg speed < 5 km/hr | 60 min | Traffic API (or mock) | Tier 2 |
| Civil Disruption / Bandh | Officially declared bandh confirmed by 2+ verified sources | Any duration | Advisory + verified news feed | Tier 3 |

Important outage clarification:
- Platform outage is not "zero orders".
- Trigger uses context-aware baseline by zone and time window.
- Example: 7-9 PM weekday baseline drop > 70% qualifies; 3-5 AM low demand does not.

## 5. What Is Not Covered

- Health or hospitalization costs
- Vehicle repair/damage/breakdown
- Personal accident or life compensation
- Voluntary non-working by worker choice
- Deactivation/suspension/rating penalties by platform
- Events shorter than minimum duration thresholds
- Any event not listed in covered-trigger table

## 6. Eligibility Conditions (All Must Pass)

1. Active paid policy covering event timestamp
2. Verified zone presence via GPS (within 2 km of affected zone, cross-checked with route history)
3. Prior activity threshold met:
   - At least 18 deliveries, OR
   - At least 14 active working hours in prior 7 days
4. Active shift alignment: only disruption time overlapping active shift window is counted
5. Platform-validated status: worker must be marked active/accepting orders, not offline/on-break

## 7. Payout Calculation

### Step 1: Hourly income estimate

Hourly Income = Avg Daily Earnings (last 14 days) / Avg Daily Working Hours (last 14 days)

For new workers (<14 days):
- Use zone/city segment median hourly proxy

Income integrity controls:
- Hard cap at 90th percentile for comparable workers in same zone/tier
- Flag if rolling average jumps > 40% above prior 4-week baseline

### Step 2: Gross payout

Gross Payout = Lost Hours x Hourly Income x Event Severity Factor

Lost Hours includes only overlap where:
- Event is active
- Worker is zone-verified
- Worker is inside active shift window

### Step 3: Apply co-pay and caps

Final Payout = min(Gross Payout x 0.80, Daily Cap, Remaining Weekly Cap)

- 20% co-pay limits moral hazard
- Daily and weekly caps enforce portfolio control

### Minimum transfer rule

- If calculated payout >= Rs 20: transfer immediately via UPI
- If calculated payout < Rs 20: accumulate in in-app balance, settle at week-end

## 8. Event Severity Factors

| Event | Factor | Rationale |
| --- | ---: | --- |
| Government Curfew / Section 144 | 1.20 | Complete movement halt; peak earning window impact |
| Civil Disruption / City Bandh | 1.10 | Near-total shutdown and safety constraints |
| Heavy Rain / Flood | 1.00 | Full outdoor delivery disruption |
| Platform Outage | 1.00 | Significant assignment interruption |
| Severe Air Pollution (AQI > 400) | 0.80 | Partial continuation possible with reduced throughput |
| Fuel Supply Disruption | 0.65 | Partial impact; alternatives/reserves may exist |
| Severe Traffic / Road Closure | 0.50 | Reduced capacity but alternate routing often possible |

## 9. Worked Examples

### Example A: Heavy Rain, Tier 2

Inputs:
- Earnings/day: Rs 980
- Hours/day: 9
- Hourly = 980/9 = Rs 108.89
- Lost hours: 3.5
- Factor: 1.00

Gross = 3.5 x 108.89 x 1.00 = Rs 381.11
Final = 381.11 x 0.80 = Rs 304.89 (approx Rs 305)
Cap checks: pass (below Tier 2 daily/weekly limits)

### Example B: Platform Outage, Tier 1

Inputs:
- Earnings/day: Rs 830
- Hours/day: 9
- Hourly = Rs 92.22
- Lost hours: 52 min = 0.867 hr
- Factor: 1.00

Gross = 0.867 x 92.22 = Rs 79.94
Final = 79.94 x 0.80 = Rs 63.95 (approx Rs 64)

### Example C: Section 144 Curfew, Tier 3

Inputs:
- Earnings/day: Rs 1,060
- Hours/day: 9
- Hourly = Rs 117.78
- Lost hours: 5.5
- Factor: 1.20

Gross = 5.5 x 117.78 x 1.20 = Rs 777.35
Final = 777.35 x 0.80 = Rs 621.88 (approx Rs 622)

### Example D: Weekly cap overflow, Tier 3

Calculated events in one week:
- E1 = Rs 680
- E2 = Rs 890
- E3 = Rs 1,040
- Total = Rs 2,610

Tier 3 weekly cap = Rs 2,500
Paid:
- E1 full (Rs 680)
- E2 full (Rs 890)
- E3 capped to remaining Rs 930
Total paid = Rs 2,500

## 10. Fraud Risk Management

### 10.1 Key risks and controls

- GPS spoofing:
  - Velocity impossibility checks, accelerometer and route-consistency checks
- Earnings inflation:
  - 90th percentile cap + growth anomaly checks
- Activity gaming:
  - Validate deliveries/hours with platform event timestamps
- Duplicate claims:
  - Event dedup key (event type + worker ID + timestamp)
- Coordinated group abuse:
  - Account-network clustering and simultaneous pattern detection
- Policy timing abuse:
  - First-time 48-hour waiting period

### 10.2 Fraud Risk Score (FRS)

| FRS Range | Action |
| --- | --- |
| 0 to 30 | Auto-approve; full payout release |
| 31 to 65 | 90% immediate, 10% held for 24-hour automated secondary review |
| 66 to 100 | Full hold, reasoned notification in <=10 min, manual review within 48 hours |

Rejection communication standard:
- Specific reason must be shown (for example: offline during event, minimum duration not met, failed eligibility)

### 10.3 Audit trail requirements

For every approved/rejected payout, log:
- Trigger source + measured value
- Zone match decision
- GPS evidence at event time
- Shift-window check outcome
- FRS and contributing factors
- Formula inputs/outputs and cap application
- UPI transfer initiation and settlement timestamps

## 11. Dispute Resolution

- Worker can dispute rejected/reduced payouts within 72 hours via app
- Resolution target: 48 hours
- If worker wins: full payout release and no FRS penalty
- If rejected: written explanation; decision final for that case

Calibration rule:
- If worker wins 2+ disputes in 3 months, flag for FRS calibration review (possible over-stringent scoring)

Abuse rule:
- 4+ disputes in one month with all rejected triggers behavioral review

## 12. Financial Sustainability Model

Core sustainability controls:
- Co-pay multiplier 0.80
- Strict daily/weekly tier caps
- Partial-impact factors < 1.0 (traffic 0.50, fuel 0.65, severe AQI 0.80)
- Aggregate stop-loss reinsurance at 90% of weekly premium pool

### 12.1 Catastrophic event layers

Layer 1: Disaster-week enhanced caps
- Triggered when Red Alert persists >=2 days, or official disaster declaration exists
- Weekly cap uplift = 1.5x for affected workers/zones for that week

| Tier | Normal Weekly Cap | Disaster-Week Cap |
| --- | ---: | ---: |
| Tier 1 | Rs 900 | Rs 1,350 |
| Tier 2 | Rs 1,600 | Rs 2,400 |
| Tier 3 | Rs 2,500 | Rs 3,750 |

Layer 2: Aggregate stop-loss reinsurance
- Trigger: payouts exceed 90% of weekly premium pool
- Excess paid by reinsurer, not core pool

Layer 3: Zone anomaly freeze
- If single-zone claims exceed 3x expected weekly volume, auto-route to manual review

### 12.2 Illustrative pool (pilot assumption)

| Tier | Workers | Premium Pool | Claim Rate | Avg Payout | Expected Payout | Surplus |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Tier 1 | 500 | Rs 39,500 | 10% | Rs 250 | Rs 12,500 | Rs 27,000 |
| Tier 2 | 350 | Rs 45,150 | 15% | Rs 420 | Rs 22,050 | Rs 23,100 |
| Tier 3 | 150 | Rs 26,850 | 20% | Rs 600 | Rs 18,000 | Rs 8,850 |
| Total | 1,000 | Rs 1,11,500 | - | - | Rs 52,550 | Rs 58,950 |

Illustrative loss ratio: about 47% in this scenario; pilot target stabilization may trend toward 60% to 65% depending on maturity, mix, and claim experience.

## 13. Predictive Risk Alerts and Temporary Upgrade

- Model forecasts next-day disruption probability per zone
- If probability > 60%, send evening proactive alert
- Offer optional one-tier temporary upgrade for remaining days of current cycle

Rules:
- Upgrade applies only to remaining days in current week
- Does not permanently alter base risk tier
- Tier 3 receives alert only (no upgrade offer)
- Top-up collected via normal UPI flow

Example:
- "Rain probability in your zone tomorrow: 68%. Upgrade to Tier 2 for this week for Rs 20 extra."

## 14. Payout Processing SLA (10 Minutes)

| Stage | Action | SLA Window |
| --- | --- | --- |
| Trigger detected | Event threshold crosses, impacted workers identified | T+0 min |
| Eligibility check | Policy, GPS, shift, activity validation | T+1 to T+2 |
| Fraud scoring | FRS computed and action path selected | T+2 to T+3 |
| Payout computation | Formula and caps applied | T+3 to T+4 |
| UPI initiation | Transfer starts for payouts >= Rs 20 | T+4 to T+6 |
| User notification | Approval/rejection with breakdown/reason | T+6 to T+8 |
| Settlement + logging | Settlement confirmation and audit write | T+8 to T+10 |

Payment operations:
- Standard max single payout transaction: up to applicable cap
- Disaster-week max per-worker weekly cap can rise to Rs 3,750 for Tier 3 equivalent
- Failed UPI transfer retry policy: 3 attempts in 2 hours
- If all retries fail: worker can update UPI and claim held amount within 7 days

## 15. Compliance and Launch Notes

- This document is a pilot product model and technical design reference.
- Premium, frequency assumptions, and reinsurance terms must be validated by actuarial, legal, and regulatory review before production launch.
- Tax treatment of payouts requires jurisdiction-specific legal guidance.

## 16. Architecture Mapping (Aligned to Arch.png)

This section maps the written insurance model to the architecture diagram in this repository (`Arch.png`) and clarifies execution order.

### 16.1 External oracle layer

Signal inputs:
- Environmental: AccuWeather + IMD feed
- Civic/mobility: Google Places + GDELT signals
- Platform reliability: Downdetector enterprise signal

Processing:
- Oracle outputs are normalized by the Go polling layer
- Data is written to queue/storage for downstream event matching
- Only threshold-qualified disruptions continue into fraud and payout controllers

### 16.2 Access and gateway layer

- Supabase OAuth handles identity and session authentication
- Traefik acts as API gateway/load balancer into backend services

### 16.3 Backend controller layer (Go)

Controller mapping from the architecture:
- Go cron job poller: asynchronous ingestion and polling schedule
- User and policy manager: registration, zone verification, active policy lock
- Dynamic premium calculator: AI-assisted weekly underwriting output
- Parametric trigger controller: listens for queued events and maps affected workers
- Fraud engine controller: obtains AI fraud score and computes final FRS action
- Wallet and payout manager: computes payable amount and triggers payout API

### 16.4 FRS decisioning bands (real-time path)

Gate sequence:
1. Rule-based bouncer: policy-age checks, duplicate-event suppression
2. Haversine velocity model: GPS spoofing risk
3. Isolation Forest: earnings anomaly checks
4. Graph model: collusion/group pattern checks

Decision bands:
- FRS 0-30: auto-approve
- FRS 31-65: release 90%, hold 10% for 24-hour secondary automated review
- FRS 66-100: withhold full payout and route to manual review

### 16.5 Payout logic (real-time path)

Computation:
- Gross = Lost Hours x Hourly Income x Severity Factor
- Final = min(Gross x 0.80, Daily Cap, Remaining Weekly Cap)

Settlement target:
- Qualifying payouts >= Rs 20 should complete UPI initiation and worker notification within the 10-minute SLA window

### 16.6 Worker app interface dependencies

Runtime payout eligibility depends on platform-side worker context:
- Live GPS pings
- Shift/active status
- Recent 14-day earnings and activity history

These signals are mandatory for policy-status validation, lost-hour computation, and fraud gating.

### 16.7 Persistence mapping

- PostgreSQL stores worker profiles, policy records, and contract state
- Kafka (Confluent serverless in architecture) carries event tasks and live state transport
- ClickHouse stores time-series telemetry and derived AI features

### 16.8 Risk and pricing engine (lifecycle path)

The diagram also shows:
- Dynamic premium calculator in backend
- AI risk underwriting support in FastAPI microservice
- Tier assignment (Tier 1/2/3)

Important execution clarification:
- This pricing/risk engine runs at onboarding and weekly renewal (policy lifecycle), not as a final step of each payout transaction.
- Real-time payouts use the pre-assigned active tier and caps from the latest valid policy cycle.

### 16.9 Reinsurance layer mapping

- Reinsurance trigger fires when payout pool utilization exceeds 90%
- Overflow liability is routed to aggregate stop-loss layer (mocked partner in pilot)

### 16.10 Architecture consistency checks (current status)

Consistent with model:
- Data-triggered event detection
- Multi-gate fraud controls before transfer
- Deterministic cap/co-pay payout formula
- UPI-first payout strategy

Recommended implementation guardrail:
- Keep final payout release deterministic via hard rules; ML outputs should contribute scored risk/features, not directly authorize money movement.

---

## 17. Related Documents

| Document | Contents |
| --- | --- |
| [aiml.md](./aiml.md) | Full AI/ML Integration Plan — Risk Assessment AI (XGBoost), Income Proxy Model, FRS Fraud Pipeline (F1–F5), ML vs Rules boundary, unified architecture overview |
| [triggers.md](./triggers.md) | Parametric Trigger Rules & Real-World APIs — trigger conditions, thresholds, severity factors, and API implementation details for all 5 disruption scenarios |
| [InsuranceModal.docx](./originals/InsuranceModal.docx) | Original formal insurance model document (source DOCX) |
| [AIModal.docx](./originals/AIModal.docx) | Original AI/ML specification document (source DOCX) |
| [trigger.docx](./originals/trigger.docx) | Original triggers specification document (source DOCX) |

