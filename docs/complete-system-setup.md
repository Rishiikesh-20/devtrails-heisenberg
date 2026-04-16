# DevTrails Complete Setup and Startup Runbook (Windows)

This document contains all commands needed to install dependencies, set up environments, start every service, and test APIs.

## 1. Prerequisites (one-time per machine)

Install these tools:

- Git
- Docker Desktop
- Python 3.12+
- Node.js LTS (20+)
- Go 1.23+

PowerShell install commands (using winget):

```powershell
winget install -e --id Git.Git
winget install -e --id Docker.DockerDesktop
winget install -e --id Python.Python.3.12
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id GoLang.Go
```

Verify installs:

```powershell
git --version
docker --version
python --version
node -v
npm -v
go version
```

If PowerShell blocks venv activation:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

---

## 2. Project bootstrap

From repo root:

```powershell
Copy-Item .env.example .env -Force
```

Default env values used by root docker compose:

```env
FRONTEND_PORT=3000
BACKEND_PORT=8080
AI_ENGINE_PORT=8000
FRAUD_ENGINE_PORT=8001
POSTGRES_PORT=55432
REDIS_PORT=6379
KAFKA_PORT=9092

POSTGRES_USER=devtrails
POSTGRES_PASSWORD=devtrails_secret
POSTGRES_DB=devtrails_core

KAFKA_CLUSTER_ID=5L6g3nShT-eMCtK--X86sw
KAFKA_TOPIC_DISRUPTION=disruption-events
KAFKA_GROUP_ID=core-api-frs-consumer

NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
CORS_ALLOWED_ORIGIN=http://localhost:3000

STRIPE_SECRET_KEY=
STRIPE_CURRENCY=inr
STRIPE_PAYMENT_METHOD=pm_card_visa
```

---

## 3. Option A: Start everything with root Docker Compose (fastest)

This starts:

- postgres
- redis
- kafka
- ai-engine
- fraud-engine
- backend
- frontend

From repo root:

```powershell
docker compose up -d --build
docker compose ps
```

Health checks:

```powershell
Invoke-RestMethod http://localhost:8080/health
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8001/health
```

Open app:

- Frontend: http://localhost:3000

Stop stack:

```powershell
docker compose down
```

---

## 4. Option B: Run locally in separate terminals (with venv + hot reload)

Use this when team members run services independently.

### Terminal 1: Infra only (Postgres/Redis/Kafka/ClickHouse)

```powershell
cd devtrails-platform
docker compose -f infra/docker-compose.yml up -d
docker ps
```

Create Kafka topic (idempotent):

```powershell
docker exec --workdir /opt/kafka/bin devtrails-kafka ./kafka-topics.sh --bootstrap-server localhost:9092 --create --if-not-exists --topic disruption-events --partitions 3 --replication-factor 1
```

### Terminal 2: AI Engine (Python FastAPI)

```powershell
cd devtrails-platform\ai-engine-python
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

$env:REDIS_HOST="localhost"
$env:REDIS_PORT="6379"
$env:REDIS_DB="0"

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 3: Fraud Detection Engine (Python FastAPI)

```powershell
cd fraud-detection-engine
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

$env:REDIS_HOST="localhost"
$env:REDIS_PORT="6379"

uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### Terminal 4: Backend Go API

```powershell
cd devtrails-platform\backend-go
go mod tidy

$env:PORT="8080"
$env:DATABASE_URL="postgres://devtrails:devtrails_secret@localhost:55432/devtrails_core?sslmode=disable"
$env:REDIS_ADDR="localhost:6379"
$env:KAFKA_BROKER="localhost:9092"
$env:KAFKA_TOPIC_DISRUPTION="disruption-events"
$env:KAFKA_GROUP_ID="core-api-frs-consumer"
$env:AI_ENGINE_URL="http://localhost:8000"
$env:FRAUD_ENGINE_URL="http://localhost:8001"
$env:CORS_ALLOWED_ORIGIN="http://localhost:3000"
$env:CONTRACT_VALIDATION_ENABLED="true"
$env:CONTRACTS_DIR="../../contracts"

# Optional weather poller tuning
$env:POLLING_LATITUDE="28.6139"
$env:POLLING_LONGITUDE="77.2090"
$env:POLLING_ZONE="south_delhi"
$env:POLL_INTERVAL_MINUTES="10"

# Optional Stripe (leave empty for local dry run)
$env:STRIPE_SECRET_KEY=""
$env:STRIPE_CURRENCY="inr"
$env:STRIPE_PAYMENT_METHOD="pm_card_visa"

go run ./cmd/server
```

### Terminal 5: Oracle Service

```powershell
cd devtrails-platform\oracle-service
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

$env:KAFKA_BROKER="localhost:9092"
$env:KAFKA_TOPIC_DISRUPTION="disruption-events"
$env:EVENT_ZONE="south_delhi"

python src/main.py
```

### Terminal 6: Frontend PWA

```powershell
cd devtrails-platform\frontend-pwa
npm install
$env:NEXT_PUBLIC_BACKEND_URL="http://localhost:8080"
npm run dev
```

App URL:

- http://localhost:3000

Stop infra-only stack:

```powershell
cd devtrails-platform
docker compose -f infra/docker-compose.yml down
```

---

## 5. API list and test commands

## 5.1 Backend Go APIs (port 8080)

Routes currently exposed:

- GET /health
- POST /api/v1/register
- POST /api/v1/login
- POST /api/v1/reports
- GET /api/v1/reports
- GET /api/v1/admin/metrics
- GET /api/v1/weather
- GET /api/v1/isitdown
- POST /api/register (compat)
- POST /api/login (compat)
- GET /api/admin/metrics (compat)
- GET /api/signals (compat)
- GET /wallet?user_id=<uuid>
- GET /payouts?user_id=<uuid>
- GET /claims?user_id=<uuid>
- GET /api/wallet?user_id=<uuid> (compat)
- GET /api/payouts?user_id=<uuid> (compat)
- GET /api/claims?user_id=<uuid> (compat)

Smoke test commands:

```powershell
Invoke-RestMethod http://localhost:8080/health
```

Register user:

```powershell
$register = Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/register -ContentType "application/json" -Body (@{
  email="worker@test.com"
  full_name="John Doe"
  zone="south_delhi"
  shift_start="09:00"
  shift_end="17:00"
} | ConvertTo-Json)

$register
$userId = $register.id
```

Login:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/login -ContentType "application/json" -Body (@{
  email="worker@test.com"
  password="demo"
} | ConvertTo-Json)
```

Wallet/Payouts/Claims:

```powershell
Invoke-RestMethod "http://localhost:8080/wallet?user_id=$userId"
Invoke-RestMethod "http://localhost:8080/payouts?user_id=$userId"
Invoke-RestMethod "http://localhost:8080/claims?user_id=$userId"
```

Reports and metrics:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/v1/reports -ContentType "application/json" -Body (@{
  user_id=$userId
  zone="south_delhi"
  category="weather"
  severity=4
  details="Waterlogging and no pickups"
} | ConvertTo-Json)

Invoke-RestMethod "http://localhost:8080/api/v1/reports?zone=south_delhi&limit=20"
Invoke-RestMethod http://localhost:8080/api/v1/admin/metrics
Invoke-RestMethod http://localhost:8080/api/v1/weather
Invoke-RestMethod http://localhost:8080/api/v1/isitdown
```

## 5.2 AI Engine APIs (port 8000)

Routes currently exposed:

- GET /health
- POST /calculate-tier
- POST /evaluate-frs
- POST /verify-claims

Health:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

Calculate tier:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8000/calculate-tier -ContentType "application/json" -Body (@{
  zone="south_delhi"
  shift_start="09:00"
  shift_end="17:00"
} | ConvertTo-Json)
```

Evaluate FRS (single):

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8000/evaluate-frs -ContentType "application/json" -Body (@{
  claim_id="CLM-001"
  user_id="USR-001"
  zone="south_delhi"
  claimed_amount=500
  avg_weekly_earnings=400
  recent_claims=2
  shared_device_count=0
  linked_account_count=1
} | ConvertTo-Json)
```

Verify claims (AI-engine list payload shape):

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8000/verify-claims -ContentType "application/json" -Body (@(
  @{
    user_id="USR-001"
    event_type="heavy_rain"
    event_timestamp=1711990000
    zone="south_delhi"
    claimed_amount=500
    avg_weekly_earnings=400
    recent_claims=1
    shared_device_count=0
    linked_account_count=0
  }
) | ConvertTo-Json)
```

## 5.3 Fraud Detection Engine APIs (port 8001)

Routes currently exposed:

- GET /health
- POST /api/v1/fraud/gate/1
- POST /api/v1/fraud/gate/2
- POST /api/v1/fraud/gate/3
- POST /api/v1/fraud/gate/4
- POST /api/v1/fraud/score
- POST /verify-claims
- POST /api/v1/admin/reset-claims
- GET /docs (Swagger)

Health:

```powershell
Invoke-RestMethod http://localhost:8001/health
```

Verify claims batch payload (used by backend-go integration):

```powershell
$batchPayload = @{
  batch_id = [guid]::NewGuid().ToString()
  event_id = [guid]::NewGuid().ToString()
  event_type = "heavy_rain"
  zone_id = "south_delhi"
  submitted_at = (Get-Date).ToUniversalTime().ToString("o")
  claims = @(
    @{
      claim_id = [guid]::NewGuid().ToString()
      worker_id = [guid]::NewGuid().ToString()
      policy_id = [guid]::NewGuid().ToString()
      policy_started_at = (Get-Date).AddDays(-7).ToUniversalTime().ToString("o")
      is_renewal = $false
      claimed_amount = 400
      currency = "inr"
      avg_weekly_earnings = 700
      recent_claims = 1
      device_link_count = 0
      account_link_count = 0
    }
  )
} | ConvertTo-Json -Depth 6

Invoke-RestMethod -Method Post -Uri http://localhost:8001/verify-claims -ContentType "application/json" -Body $batchPayload
```

---

## 6. Kafka trigger commands (end-to-end event testing)

### 6.1 Create topic

```powershell
docker exec --workdir /opt/kafka/bin devtrails-kafka ./kafka-topics.sh --bootstrap-server localhost:9092 --create --if-not-exists --topic disruption-events --partitions 3 --replication-factor 1
```

### 6.2 Publish a contract-valid event payload

Use this payload shape when contract validation is enabled:

```json
{
  "event_id": "uuid",
  "event_type": "heavy_rain",
  "zone_id": "south_delhi",
  "severity_factor": 1.0,
  "triggered_at": "2026-04-04T18:10:00Z",
  "source": "manual_override"
}
```

PowerShell publish command:

```powershell
$event = @{
  event_id = [guid]::NewGuid().ToString()
  event_type = "heavy_rain"
  zone_id = "south_delhi"
  severity_factor = 1.0
  triggered_at = (Get-Date).ToUniversalTime().ToString("o")
  source = "manual_override"
} | ConvertTo-Json -Compress

$event | docker exec -i devtrails-kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server localhost:9092 --topic disruption-events
```

### 6.3 Optional helper script (bash)

There is a helper script:

- devtrails-platform/scripts/fire_mock_triggers.sh

Run from Git Bash/WSL:

```bash
cd devtrails-platform/scripts
chmod +x fire_mock_triggers.sh
./fire_mock_triggers.sh
```

---

## 7. Dependency files by service

- AI Engine: devtrails-platform/ai-engine-python/requirements.txt
- Fraud Engine: fraud-detection-engine/requirements.txt
- Oracle Service: devtrails-platform/oracle-service/requirements.txt
- Frontend: devtrails-platform/frontend-pwa/package.json
- Backend Go: devtrails-platform/backend-go/go.mod

---

## 8. Optional scripts

Hydrate dependencies (bash script):

```bash
cd devtrails-platform/scripts
chmod +x init.sh
./init.sh
```

End-to-end integration test script (bash):

```bash
cd devtrails-platform/scripts
chmod +x run_integration_test.sh
./run_integration_test.sh
```

---

## 9. Common troubleshooting

Port already in use:

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :8080
netstat -ano | findstr :8000
netstat -ano | findstr :8001
```

Check container logs:

```powershell
docker compose logs -f backend
docker compose logs -f ai-engine
docker compose logs -f fraud-engine
docker compose logs -f frontend
```

Reset local Docker stack:

```powershell
docker compose down
docker compose up -d --build
```

Reset infra-only stack:

```powershell
cd devtrails-platform
docker compose -f infra/docker-compose.yml down
docker compose -f infra/docker-compose.yml up -d
```

---

## 10. Team startup checklist

Each person should confirm:

1. Infra healthy (Postgres, Redis, Kafka up).
2. AI engine healthy at port 8000.
3. Fraud engine healthy at port 8001.
4. Backend healthy at port 8080.
5. Frontend reachable at port 3000.
6. Register API works and returns a user id.
7. Wallet/claims/payout endpoints work with that user id.
8. Kafka disruption event can be published and consumed.

If all 8 pass, the system is fully up.
