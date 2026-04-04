# DevTrails Platform

A microservices-based parametric insurance platform for gig-workers, featuring real-time event triggers (weather/traffic), dynamic risk scoring, and a multi-gate fraud detection engine.

## 🏗 Architecture & Components

The system is built using a polyglot microservices architecture. It contains the following modules:

### 1. Infrastructure (`/infra`)

- Orchestrated via `docker-compose.yml`.
- **Kafka** (KRaft mode, NO Zookeeper): Event bus for system triggers (`disruption-events`).
- **PostgreSQL 15**: Core relational state (Users, Policies, Claims).
- **Redis 7**: Caching and FRS Gate 1 (Duplicate Claim Hash checks).
- **ClickHouse**: High-performance time-series database for raw weather/traffic telemetry.

### 2. Core API (`/backend-go`)

- **Tech Stack**: Go 1.22, Gin, GORM, `segmentio/kafka-go`, `redis/go-redis`.
- **Responsibilities**:
  - Exposes REST endpoints (e.g., `/api/v1/register`).
  - Manages Postgres database models (Users, Workers).
  - Consumes from the Kafka `disruption-events` topic.
  - Automatically identifies in-zone users during weather disruptions and triggers the Python Fraud & Risk System (FRS).

### 3. AI FRS & Risk Engine (`/ai-engine-python`)

- **Tech Stack**: Python 3.12, FastAPI, Uvicorn, Pandas, Scikit-Learn, XGBoost, Redis.
- **Responsibilities**:
  - `POST /calculate-tier`: Dynamically scores worker risk based on zone and shift timing to assign a premium tier.
  - `POST /evaluate-frs`: Evaluates incoming claims through a dummy 4-Gate rule pipeline:
    - **Gate 1**: Redis hash check (deduplication).
    - **Gate 2**: Velocity check.
    - **Gate 3**: Earnings outlier.
    - **Gate 4**: Network cluster pressure.

### 4. Oracle Service (`/oracle-service`)

- **Tech Stack**: Python 3.12, `schedule`, `kafka-python`.
- **Responsibilities**:
  - Standalone cron service polling every 10 minutes.
  - Mocks data from OpenWeatherMap. If rainfall exceeds 15mm, it immediately publishes a `heavy_rain` disruption event to Kafka.

### 5. Frontend PWA (`/frontend-pwa`)

- **Tech Stack**: Next.js 15 (App Router), React 18, Tailwind CSS, Zustand.
- **Responsibilities**:
  - Displays the Worker "Wallet Dashboard" (showing balance, premium, zone, and tier).
  - Provides a Developer Control Panel ("Simulate Weather Event") to trigger mock extreme weather events.

## 🚀 Current Status & Next Steps

**Completed:**
✅ Project scaffolding and directory initialization.
✅ Infrastructure docker-compose and init-scripts.
✅ Application boilerplates, Dockerfiles, and `requirements.txt`/`go.mod`/`package.json`.
✅ Initial implementation of the Go API, Python AI Engine, Oracle Cron, and Next.js UI.

**Pending (Next Steps):**
🚧 **Global Docker Compose**: Unite the application APIs, frontend, and Oracle script into a root `docker-compose.yml` so the entire stack comes up automatically connected to the database networks.
🚧 **Frontend Integration**: Hook the Next.js UI up to the actual Go backend endpoints to trigger real actions instead of using placeholders.
🚧 **Environment Polish**: Finalize intra-docker networking hostnames (e.g., pointing Go to `http://ai-engine-python:8000`).

## 🛠 Commands

Please refer to [cmds.md](./cmds.md) for instructions on initializing, running, and testing the platform.
