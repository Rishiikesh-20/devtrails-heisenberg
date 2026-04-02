# Backend Go Setup Commands

Run these from `devtrails-platform/backend-go`:

```bash
go mod tidy
go run ./cmd/server
```

Optional with explicit env values:

```bash
PORT=8080 \
DATABASE_URL="postgres://devtrails:devtrails_secret@localhost:5432/devtrails_core?sslmode=disable" \
REDIS_ADDR="localhost:6379" \
KAFKA_BROKER="localhost:9092" \
KAFKA_TOPIC_DISRUPTION="disruption-events" \
KAFKA_GROUP_ID="core-api-frs-consumer" \
AI_ENGINE_URL="http://localhost:8000" \
go run ./cmd/server
```
