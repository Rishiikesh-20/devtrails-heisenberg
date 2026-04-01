# DevTrails Platform Commands

This document contains all the necessary commands to initialize, run, and test the DevTrails platform locally.

## 1. Initialization
If you are starting fresh, you can use the initialization script to hydrate all frontend and backend dependencies:

```bash
cd devtrails-platform
chmod +x scripts/init.sh
./scripts/init.sh
```
*(Alternatively, you can run the monorepo prep PowerShell script: `.\scaffold-monorepo.ps1 -CreateServiceSkeletons`)*

---

## 2. Running the Infrastructure (Databases & Kafka)
Before starting any of the backend services, you must spin up the infrastructure layer:

```bash
cd devtrails-platform
docker compose -f infra/docker-compose.yml up -d
```
You can verify they are running with `docker ps`.

---

## 3. Running the Microservices Locally (Standalone)
Currently, to run the system without a master `docker-compose.yml`, you should open separate terminal tabs for each service:

### Terminal A: AI Engine (Python)
```bash
cd devtrails-platform/ai-engine-python
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal B: Core API (Go)
*Note: Make sure the infrastructure from Step 2 is fully healthy so Go can connect to Postgres, Redis, and Kafka.*
```bash
cd devtrails-platform/backend-go
go mod tidy
go run ./cmd/server
```

### Terminal C: Oracle Cron Service (Python)
```bash
cd devtrails-platform/oracle-service
pip install -r requirements.txt
python src/main.py
```

### Terminal D: Frontend PWA (Next.js)
```bash
cd devtrails-platform/frontend-pwa
npm install
npm run dev
```
Access the frontend at: **http://localhost:3000**

---

## 4. Testing Endpoints Manually

### Register a User (Go API -> triggers Python Tier Calculation)
```bash
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@test.com",
    "full_name": "John Doe",
    "zone": "south_delhi_h3_index",
    "shift_start": "09:00",
    "shift_end": "17:00"
  }'
```

### Direct test to Python AI Engine Tier Calculator
```bash
curl -X POST http://localhost:8000/calculate-tier \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "south_delhi_h3_index",
    "shift_start": "22:00",
    "shift_end": "04:00"
  }'
```

### Direct test to Python FRS Gate Evaluator
```bash
curl -X POST http://localhost:8000/evaluate-frs \
  -H "Content-Type: application/json" \
  -d '{
    "claim_id": "CLM-001",
    "user_id": "USR-001",
    "zone": "zone-c",
    "claimed_amount": 500.0,
    "avg_weekly_earnings": 400.0,
    "recent_claims": 2,
    "shared_device_count": 0,
    "linked_account_count": 1
  }'
```
