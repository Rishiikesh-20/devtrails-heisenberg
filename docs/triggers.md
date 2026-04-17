# Parametric Trigger Rules & Real-World APIs

> **Scope:** Trigger conditions, thresholds, severity factors, and API implementation details for all 5 covered disruption scenarios
> **Cross-references:** [README.md](../README.md) · [insurancemodel.md](./insurancemodel.md) · [aiml.md](./aiml.md)

All triggers are **100% deterministic and auditable** — no subjective judgment, no human in the loop. When data crosses the threshold, the system fires.

---

## 1. Extreme Weather Events (Heavy Rain / Flooding)

- **Trigger condition:** Rainfall > 15mm/hr OR active flood alert issued by IMD for the delivery zone
- **Minimum duration:** 60 minutes
- **Severity factor:** 1.00

### APIs

| API | Endpoint / Field | Usage |
| --- | --- | --- |
| **Open-Meteo API** | `/v1/forecast` → hourly precipitation + wind metrics | Primary weather oracle used by backend and oracle-service pollers for deterministic threshold checks. |
| **Zone Polling Config** | Backend `pollAndStoreWeather` zone coordinates | Polls configured zone lat/lng pairs and stores normalized weather signals per zone. |

---

## 2. Food Delivery Platform Outage

- **Trigger condition:** Orders assigned in zone fall more than 70% below the zone's rolling baseline for that time window, while worker is marked active
- **Important:** Not "zero orders" — a **70% drop from the rolling baseline**. A 3–5 AM baseline is naturally low; a 7–9 PM weekday drop of 70% qualifies.
- **Minimum duration:** 30 minutes
- **Severity factor:** 1.00

### APIs

| API | Usage |
| --- | --- |
| **Swiggy City Endpoint Health Checks** | Backend downtime checker probes city endpoints (`/city/chennai`, `/city/coimbatore`, etc.) as deterministic outage proxy. |
| **Platform Order-Drop Mock Dataset** | Demo fallback for 70% baseline drop logic where first-party assignment telemetry is unavailable. |

---

## 3. Curfew or Law Enforcement Restrictions

- **Trigger condition:** Movement restrictions officially imposed by district/city authority (e.g., Section 144)
- **Minimum duration:** Any duration
- **Severity factor:** 1.20 — peak-hour curfews eliminate the highest-earning windows

### APIs

| API | Endpoint / Filter | Usage |
| --- | --- | --- |
| **GDELT v2 Docs API** | Curfew/Section 144 keyword query | Structured global news retrieval for curfew and civic-restriction evidence. |
| **snscrape (X/Twitter public scrape)** | City + restriction keywords | Social corroboration signal used when official feed APIs are unavailable. |

---

## 4. Festival Traffic Congestion / Road Closures

- **Trigger condition:** Primary routes blocked OR average speed < 5 km/hr on major roads
- **Minimum duration:** 60 minutes
- **Severity factor:** 0.50 — alternate routes often exist, allowing partial earnings

### APIs

| API | Endpoint / Field | Usage |
| --- | --- | --- |
| **OSRM Public API** | `/route/v1/driving` duration and distance | Baseline route-time oracle for congestion and closure inference. |
| **OpenRouteService API** | `/v2/directions/driving-car` summary duration | Secondary routing oracle; trigger fires when OSRM/ORS thresholds are crossed. |

---

## 5. Fuel Shortage (LPG / Petrol)

- **Trigger condition:** > 60% fuel/LPG stations closed within 5km of zone, resulting in mass cloud kitchen shutdowns
- **Minimum duration:** 60 minutes
- **Severity factor:** 0.65 — some workers have reserves or can do short-distance runs

### APIs

| API | Endpoint / Field | Usage |
| --- | --- | --- |
| **OpenStreetMap Nominatim** | Reverse + search geocoding | Zone-aware place lookup and fuel-station proximity enrichment. |
| **GDELT + Social Consensus Signals** | Multi-source keyword hit aggregation | Confirms shortages/closures when direct station-status APIs are unavailable. |

---

## Severity Factor Summary

| Disruption Type | Severity Factor | Rationale |
| --- | :---: | --- |
| Government Curfew / Section 144 | 1.20 | Complete halt to movement; peak-hour curfews eliminate highest-earning windows |
| Heavy Rain / Flooding | 1.00 | Full outdoor delivery disruption; platforms often auto-pause assignments |
| Platform Outage | 1.00 | Significant assignment interruption; full income loss for active workers |
| LPG / Fuel Shortage | 0.65 | Partial impact — some kitchens use electric/induction; short-range runs still possible |
| Festival Traffic / Road Closure | 0.50 | Reduced capacity but alternate routes exist; partial earnings still likely |
