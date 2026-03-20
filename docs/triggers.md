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
| **OpenWeatherMap API** | `/weather` → `rain.1h` | Returns rain volume (mm) for the last hour. Free tier — suitable for hackathons. |
| **Tomorrow.io API** | Weather alerts + zone polygons | Hyper-local precipitation alerts with geographic boundary overlay. |

---

## 2. Food Delivery Platform Outage

- **Trigger condition:** Orders assigned in zone fall more than 70% below the zone's rolling baseline for that time window, while worker is marked active
- **Important:** Not "zero orders" — a **70% drop from the rolling baseline**. A 3–5 AM baseline is naturally low; a 7–9 PM weekday drop of 70% qualifies.
- **Minimum duration:** 30 minutes
- **Severity factor:** 1.00

### APIs

| API | Usage |
| --- | --- |
| **Platform API Mock** | Swiggy/Zomato do not expose live order-drop data publicly. Simulate with a mock JSON dataset for demo. |
| **DownDetector Scraper** | Python `BeautifulSoup` scraper tracking live user report spikes for Zomato/Swiggy downtime as a proxy signal. |

---

## 3. Curfew or Law Enforcement Restrictions

- **Trigger condition:** Movement restrictions officially imposed by district/city authority (e.g., Section 144)
- **Minimum duration:** Any duration
- **Severity factor:** 1.20 — peak-hour curfews eliminate the highest-earning windows

### APIs

| API | Endpoint / Filter | Usage |
| --- | --- | --- |
| **X (Twitter) API** | Stream listener on verified handles | Monitor `@CPDelhi`, `@BlrCityPolice`, etc. with NLP keywords: `"Section 144"`, `"curfew"`, `"barricade"`. |
| **NewsAPI** | City + keyword filter | Filter by local city. Requires 3+ independent source confirmations before trigger fires. |

---

## 4. Festival Traffic Congestion / Road Closures

- **Trigger condition:** Primary routes blocked OR average speed < 5 km/hr on major roads
- **Minimum duration:** 60 minutes
- **Severity factor:** 0.50 — alternate routes often exist, allowing partial earnings

### APIs

| API | Endpoint / Field | Usage |
| --- | --- | --- |
| **TomTom Traffic API** | Current travel time vs. free-flow travel time | Calculate exact speed drop ratio. Developer-friendly, hackathon-ready. |
| **Google Maps Routes API** | `duration_in_traffic` vs. `duration` | Parse the gap between traffic-adjusted and standard duration to detect severe congestion. |

---

## 5. Fuel Shortage (LPG / Petrol)

- **Trigger condition:** > 60% fuel/LPG stations closed within 5km of zone, resulting in mass cloud kitchen shutdowns
- **Minimum duration:** 60 minutes
- **Severity factor:** 0.65 — some workers have reserves or can do short-distance runs

### APIs

| API | Endpoint / Field | Usage |
| --- | --- | --- |
| **Google Places API** | Gas stations in radius → `business_status` | Query stations within radius and parse `business_status` for `CLOSED_TEMPORARILY`. Flag when threshold > 60%. |

---

## Severity Factor Summary

| Disruption Type | Severity Factor | Rationale |
| --- | :---: | --- |
| Government Curfew / Section 144 | 1.20 | Complete halt to movement; peak-hour curfews eliminate highest-earning windows |
| Heavy Rain / Flooding | 1.00 | Full outdoor delivery disruption; platforms often auto-pause assignments |
| Platform Outage | 1.00 | Significant assignment interruption; full income loss for active workers |
| LPG / Fuel Shortage | 0.65 | Partial impact — some kitchens use electric/induction; short-range runs still possible |
| Festival Traffic / Road Closure | 0.50 | Reduced capacity but alternate routes exist; partial earnings still likely |
