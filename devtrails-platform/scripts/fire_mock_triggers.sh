#!/usr/bin/env bash

set -euo pipefail

# -----------------------------------------------------------------------------
# DevTrails Hackathon Trigger Console
# Publishes mock disruption events to Kafka topic: disruption-events
# -----------------------------------------------------------------------------

KAFKA_CONTAINER="devtrails-kafka"
KAFKA_BIN="/opt/kafka/bin/kafka-console-producer.sh"
KAFKA_BOOTSTRAP="localhost:9092"
KAFKA_TOPIC="disruption-events"
DEFAULT_ZONE="south_delhi"

# ANSI colors for a clean demo-friendly terminal UI.
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
CYAN='\033[1;36m'
NC='\033[0m'

print_header() {
  echo -e "${CYAN}==============================================${NC}"
  echo -e "${CYAN} DevTrails Mock Trigger Injector (Kafka)${NC}"
  echo -e "${CYAN}==============================================${NC}"
}

require_commands() {
  if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}Error: docker is not installed or not in PATH.${NC}"
    exit 1
  fi
}

ensure_kafka_container_running() {
  if ! docker ps --format '{{.Names}}' | grep -Fxq "${KAFKA_CONTAINER}"; then
    echo -e "${RED}Error: Kafka container '${KAFKA_CONTAINER}' is not running.${NC}"
    echo -e "${YELLOW}Tip: Start infra first (e.g., docker compose -f infra/docker-compose.yml up -d).${NC}"
    exit 1
  fi
}

# Generates a short identifier used in event_id.
# Uses uuidgen when available, with a portable fallback.
short_id() {
  if command -v uuidgen >/dev/null 2>&1; then
    uuidgen | tr '[:upper:]' '[:lower:]' | cut -d'-' -f1
  else
    tr -dc 'a-f0-9' </dev/urandom | head -c 8
  fi
}

publish_event() {
  local event_type="$1"
  local severity="$2"
  local id_prefix="$3"

  local uid epoch event_id payload
  uid="$(short_id)"
  epoch="$(date +%s)"
  event_id="${id_prefix}_${uid}"

  payload="{\"event_id\": \"${event_id}\", \"event_type\": \"${event_type}\", \"zone\": \"${DEFAULT_ZONE}\", \"severity_factor\": ${severity}, \"timestamp\": ${epoch}}"

  echo -e "${YELLOW}Publishing event to topic '${KAFKA_TOPIC}'...${NC}"

  echo "${payload}" | docker exec -i "${KAFKA_CONTAINER}" "${KAFKA_BIN}" \
    --bootstrap-server "${KAFKA_BOOTSTRAP}" \
    --topic "${KAFKA_TOPIC}"

  echo -e "${GREEN}Success: Event published.${NC}"
  echo -e "${GREEN}Payload:${NC} ${payload}"
  echo
}

show_menu() {
  echo -e "${YELLOW}Choose a disruption to fire:${NC}"
  echo "  1) Heavy Rain (severity 1.0)"
  echo "  2) Platform Outage / Server Crash (severity 1.0)"
  echo "  3) Curfew / Festival Traffic (severity 0.5)"
  echo "  q) Quit"
  echo
}

main() {
  require_commands
  ensure_kafka_container_running

  while true; do
    print_header
    show_menu
    read -r -p "Enter choice [1/2/3/q]: " choice

    case "${choice}" in
      1)
        publish_event "heavy_rain" "1.0" "mock_rain"
        ;;
      2)
        publish_event "platform_outage" "1.0" "mock_outage"
        ;;
      3)
        publish_event "curfew_traffic" "0.5" "mock_traffic"
        ;;
      q|Q)
        echo -e "${GREEN}Exiting trigger console.${NC}"
        exit 0
        ;;
      *)
        echo -e "${RED}Invalid choice. Please select 1, 2, 3, or q.${NC}"
        echo
        ;;
    esac

    read -r -p "Press Enter to continue..." _
    clear || true
  done
}

main "$@"
