# DevTrails Platform - Project Plan

This document outlines the responsibilities and development phases for the microservices parametric insurance platform.

## 👥 Roles & Responsibilities

### Member 1: The UI & Integration Lead (Next.js)
**Mission:** Build the rider-facing app and the Admin trigger panel.
*   **The Onboarding Flow:** Build a form where a rider enters their details and Zone. Call the Go API `POST /register`, wait for the AI Engine to return the Risk Tier, and display "You are covered under Tier X."
*   **The Wallet Dashboard:** Build a UI that polls the Go API (or uses WebSockets) to show the rider's current ledger balance. When a payout clears, this number must update on screen.
*   **The "Make it Rain" Admin Panel:** Build a hidden UI button that sends a `POST` request to Member 2's Oracle Service, telling it to ignore the real weather and force-publish a "Heavy Rain" event to Kafka immediately for demo purposes.

### Member 2: Data Ingestion & External Oracles (Python or Node.js)
**Mission:** Build the standalone service that listens to the real world.
*   **The Weather Poller:** Write a script that runs a `while True:` loop every 5 minutes. It must call the OpenWeatherMap API (`/data/2.5/weather?lat={X}&lon={Y}`).
*   **The Threshold Logic:** Parse the JSON response. If `rain.1h > 15mm`, the trigger condition is met.
*   **Kafka Producer:** When the threshold is met (or when Member 1 clicks the Admin force-trigger button), publish a strictly formatted JSON payload to the Kafka `disruption-events` topic.
*   **Payload Contract:** `{"event_id": "evt_998", "event_type": "heavy_rain", "zone": "south_delhi", "severity_factor": 1.0, "timestamp": 1711990000}`

### Member 3: The Verifier & Orchestrator (Go Backend)
**Mission:** Catch the Kafka event and figure out exactly who gets paid.
*   **Kafka Consumer:** Write the Go routine that listens to the `disruption-events` topic.
*   **The Verifier Logic:** When a "Heavy Rain in South Delhi" event arrives, query the PostgreSQL database:
    `SELECT user_id, active_policy_tier FROM users WHERE zone = 'south_delhi' AND shift_status = 'active';`
*   **The Orchestrator:** Format the array of affected riders into a JSON batch payload and make an HTTP POST request to Member 4's Python AI Engine: `POST http://ai-engine:8000/verify-claims`.
*   **Handling the Response:** Wait for Python to return the array with attached FRS scores and decisions. Pass the "AUTO-APPROVE" claims to Member 5.

### Member 4: AI Verification & FRS Engine (Python FastAPI)
**Mission:** Receive the batch of claims from the Verifier and execute the 4 Fraud Gates.
*   **The API Endpoint:** Expose `POST /verify-claims` to receive the list of users supposedly in the rain.
*   **Gate 1 (Duplicate Check - Redis):** For every user, generate `SHA-256(worker_id + event_type + timestamp)`. Attempt to save it in Redis. If it already exists, set `FRS = 100` (Reject).
*   **Gate 2 (Velocity/GPS AI):** Query the database for that user's last two GPS pings. Write the Haversine formula in Python. If they traveled 5km in 1 minute, set `FRS = 85` (Hold).
*   **Gate 3 (Earnings Outlier):** Query their 14-day earnings average. If today's deliveries are 3x normal, set `FRS = 60` (Partial Hold).
*   **The Response:** Return the batch back to Go formatted like this: `[{"user_id": "Raju123", "frs_score": 12, "decision": "AUTO-APPROVE"}, ...]`.

### Member 5: The Payout Module & Infra Lead
**Mission:** Handle the money and keep the Docker network alive.
*   **The Payout Math:** Receive the approved claims from Member 3. Calculate the actual INR value: `(Lost Hours × Hourly Wage × Severity Factor × 0.80 co-pay)`.
*   **The Settlement API:** Write a Go function `ProcessPayout()`. For Phase 2, this function simply runs an `UPDATE ledgers SET balance = balance + 360 WHERE user_id = 'Raju123';` in Postgres.
*   **The Infrastructure God:** Manage `docker-compose.yml`. Ensure Kafka (KRaft), Postgres, and Redis boot up correctly. Ensure Member 3's Go app can talk to Member 4's Python app over the internal Docker network.

---

## ⚡ Execution Strategy (72 Hours)

1.  **Define the JSON Contracts NOW:** Member 2, 3, and 4 must agree on the exact JSON formats being sent between Kafka, Go, and Python. Parallel coding is only possible if contracts are locked in early.
2.  **Mock First, API Second:** Tell Member 2 (Oracle) to pass a hardcoded JSON string to Kafka initially. Once Member 3 (Verifier) proves they can read it, Member 2 can spend time writing the actual OpenWeatherMap HTTP request.
3.  **Skip ClickHouse (Phase 2 Adjustment):** Current boilerplate includes ClickHouse. Drop it for Phase 2 as it is too much overhead for a 3-day sprint. Write logs to Postgres or just stdout in the terminal instead.
