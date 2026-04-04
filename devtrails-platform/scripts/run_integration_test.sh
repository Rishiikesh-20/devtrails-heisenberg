#!/usr/bin/env bash

set -euo pipefail

IFS=$'\n\t'

BLUE='\033[1;34m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RED='\033[1;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GO_PID=""
PY_PID=""
FRAUD_PID=""
USER_ID=""

log_step() {
	echo -e "${BLUE}==> $*${NC}"
}

log_ok() {
	echo -e "${GREEN}✔ $*${NC}"
}

log_warn() {
	echo -e "${YELLOW}⚠ $*${NC}"
}

log_err() {
	echo -e "${RED}✖ $*${NC}" >&2
}

cleanup() {
	log_step "Teardown: stopping background microservices"

	if [[ -n "${PY_PID}" ]]; then
		kill -- -"${PY_PID}" 2>/dev/null || true
		wait "${PY_PID}" 2>/dev/null || true
		log_ok "Stopped Python process ${PY_PID}"
	fi

	if [[ -n "${GO_PID}" ]]; then
		kill -- -"${GO_PID}" 2>/dev/null || true
		wait "${GO_PID}" 2>/dev/null || true
		log_ok "Stopped Go process ${GO_PID}"
	fi

	if [[ -n "${FRAUD_PID}" ]]; then
		kill -- -"${FRAUD_PID}" 2>/dev/null || true
		wait "${FRAUD_PID}" 2>/dev/null || true
		log_ok "Stopped Fraud Engine process ${FRAUD_PID}"
	fi
}

trap cleanup EXIT

wait_for_http() {
	local url="$1"
	local label="$2"
	local attempts=0
	local max_attempts=45

	log_step "Waiting for ${label} at ${url}"
	until curl -fsS "$url" >/dev/null 2>&1; do
		attempts=$((attempts + 1))
		if [[ "$attempts" -ge "$max_attempts" ]]; then
			log_err "Timed out waiting for ${label}"
			return 1
		fi
		sleep 2
	done
	log_ok "${label} is responsive"
}

wait_for_postgres() {
	local attempts=0
	local max_attempts=60

	log_step "Waiting for PostgreSQL to accept connections"
	until docker exec devtrails-postgres pg_isready -U devtrails -d devtrails_core >/dev/null 2>&1; do
		attempts=$((attempts + 1))
		if [[ "$attempts" -ge "$max_attempts" ]]; then
			log_err "PostgreSQL did not become ready in time"
			return 1
		fi
		sleep 2
	done
	log_ok "PostgreSQL is ready"
}

wait_for_redis() {
	local attempts=0
	local max_attempts=60

	log_step "Waiting for Redis to accept connections"
	until docker exec devtrails-redis redis-cli ping >/dev/null 2>&1; do
		attempts=$((attempts + 1))
		if [[ "$attempts" -ge "$max_attempts" ]]; then
			log_err "Redis did not become ready in time"
			return 1
		fi
		sleep 2
	done
	log_ok "Redis is ready"
}

wait_for_kafka() {
	local attempts=0
	local max_attempts=75

	log_step "Waiting for Kafka to accept broker connections"
	until docker exec --workdir /opt/kafka/bin devtrails-kafka ./kafka-topics.sh --bootstrap-server localhost:9092 --list >/dev/null 2>&1; do
		attempts=$((attempts + 1))
		if [[ "$attempts" -ge "$max_attempts" ]]; then
			log_err "Kafka did not become ready in time"
			return 1
		fi
		sleep 2
	done
	log_ok "Kafka is ready"
}

ensure_kafka_topics() {
	log_step "Ensuring Kafka topics exist"
	docker exec --workdir /opt/kafka/bin devtrails-kafka ./kafka-topics.sh \
		--bootstrap-server localhost:9092 \
		--create \
		--if-not-exists \
		--topic disruption-events \
		--partitions 3 \
		--replication-factor 1 >/dev/null
	log_ok "Kafka topics are ready"
}

prepare_demo_schema() {
	log_step "Preparing demo PostgreSQL schema"
	docker exec -i devtrails-postgres psql -U devtrails -d devtrails_core -v ON_ERROR_STOP=1 < "$PROJECT_ROOT/infra/init-scripts/postgres/002_add_claim_fields.sql"
	docker exec -i devtrails-postgres psql -U devtrails -d devtrails_core -v ON_ERROR_STOP=1 < "$PROJECT_ROOT/infra/init-scripts/postgres/003_add_payment_ledger_tables.sql"
	docker exec -i devtrails-postgres psql -U devtrails -d devtrails_core -v ON_ERROR_STOP=1 < "$PROJECT_ROOT/infra/init-scripts/postgres/004_relax_legacy_claim_constraints.sql"

	docker exec -i devtrails-postgres psql -U devtrails -d devtrails_core -v ON_ERROR_STOP=1 <<'SQL'
DELETE FROM ledger_entries WHERE event_id = 'demo_999';
DELETE FROM payout_transactions WHERE event_id = 'demo_999';
DELETE FROM claims WHERE event_id = 'demo_999';
DELETE FROM ledgers;
DO $$
BEGIN
	IF to_regclass('public.users') IS NOT NULL THEN
		DELETE FROM users WHERE email = 'raju@test.com';
	END IF;
END $$;
SQL
	log_ok "Demo schema is ready"
}

seed_ledger_row() {
	local user_id="$1"
	docker exec -i devtrails-postgres psql -U devtrails -d devtrails_core -v ON_ERROR_STOP=1 -c "INSERT INTO ledgers (user_id, balance) VALUES ('${user_id}', 0) ON CONFLICT (user_id) DO NOTHING;"
}

extract_user_id() {
	local response_body="$1"

	if command -v jq >/dev/null 2>&1; then
		echo "$response_body" | jq -r '.id'
		return 0
	fi

	echo "$response_body" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'
}

cd "$PROJECT_ROOT"

log_step "Step 1: Boot infrastructure"
docker compose -f infra/docker-compose.yml up -d

wait_for_postgres
wait_for_redis
wait_for_kafka
ensure_kafka_topics
prepare_demo_schema

log_step "Step 2: Boot microservices"

mkdir -p logs

log_step "Starting Python FastAPI server"
setsid bash -lc 'cd "$0" && exec uvicorn app.main:app --host 0.0.0.0 --port 8000' "$PROJECT_ROOT/ai-engine-python" > "$PROJECT_ROOT/logs/ai-engine.log" 2>&1 &
PY_PID=$!
log_ok "Python PID: ${PY_PID}"

log_step "Starting Fraud Detection Engine"
setsid bash -lc 'cd "$0" && exec uvicorn main:app --host 0.0.0.0 --port 8001' "$PROJECT_ROOT/../fraud-detection-engine" > "$PROJECT_ROOT/logs/fraud-engine.log" 2>&1 &
FRAUD_PID=$!
log_ok "Fraud Engine PID: ${FRAUD_PID}"

log_step "Starting Go orchestrator"
setsid bash -lc 'cd "$0" && exec env AI_ENGINE_URL=http://localhost:8000 FRAUD_ENGINE_URL=http://localhost:8001 go run .' "$PROJECT_ROOT/backend-go/cmd/server" > "$PROJECT_ROOT/logs/go-server.log" 2>&1 &
GO_PID=$!
log_ok "Go PID: ${GO_PID}"

wait_for_http "http://localhost:8000/health" "Python AI Engine health endpoint"
wait_for_http "http://localhost:8001/health" "Fraud Engine health endpoint"
wait_for_http "http://localhost:8080/health" "Go orchestrator health endpoint"

log_step "Step 3: Seed the victim user"
REGISTER_RESPONSE="$(curl -fsS -X POST http://localhost:8080/api/v1/register \
	-H 'Content-Type: application/json' \
	-d '{"email":"raju@test.com","full_name":"Raju Delivery","zone":"south_delhi","shift_start":"08:00","shift_end":"18:00"}')"
echo "$REGISTER_RESPONSE"

USER_ID="$(extract_user_id "$REGISTER_RESPONSE")"
if [[ -z "$USER_ID" ]]; then
	log_err "Failed to extract user id from register response"
	exit 1
fi
log_ok "Captured user ID: ${USER_ID}"
seed_ledger_row "$USER_ID"
log_ok "Seeded ledger row for user ${USER_ID}"

log_step "Step 4: Force the Kafka trigger"
KAFKA_EVENT='{"event_id":"demo_999","event_type":"heavy_rain","zone":"south_delhi","severity_factor":1.0,"timestamp":1711990000}'
printf '%s\n' "$KAFKA_EVENT" | docker exec -i --workdir /opt/kafka/bin devtrails-kafka ./kafka-console-producer.sh --bootstrap-server localhost:9092 --topic disruption-events
log_ok "Kafka event published to disruption-events"

log_step "Step 5: Verify the dominoes fell"
sleep 5

log_step "Checking claims table for event demo_999"
docker exec devtrails-postgres psql -U devtrails -d devtrails_core -c "SELECT * FROM claims WHERE event_id = 'demo_999';"

log_step "Checking ledger balance for user ${USER_ID}"
docker exec devtrails-postgres psql -U devtrails -d devtrails_core -c "SELECT balance FROM ledgers WHERE user_id = '${USER_ID}';"

log_step "Step 6: Teardown"
trap - EXIT
cleanup

log_ok "Integration test completed successfully"
