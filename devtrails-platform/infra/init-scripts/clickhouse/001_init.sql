-- ============================================================================
--  DevTrails Telemetry — ClickHouse Initial Schema
--  Database: devtrails_telemetry
-- ============================================================================

CREATE DATABASE IF NOT EXISTS devtrails_telemetry;

-- ─────────────────────────────────────────────────────────────────────────────
--  Raw Weather Telemetry (Time-Series)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devtrails_telemetry.weather_events
(
    event_id        UUID DEFAULT generateUUIDv4(),
    location        String,
    latitude        Float64,
    longitude       Float64,
    temperature_f   Float32,
    wind_speed_mph  Float32,
    humidity_pct    Float32,
    precipitation   Float32,
    weather_code    UInt16,
    description     String,
    source_api      LowCardinality(String),    -- e.g., 'openweathermap', 'weatherapi'
    raw_json        String,                     -- Full JSON payload
    recorded_at     DateTime64(3) DEFAULT now64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(recorded_at)
ORDER BY (location, recorded_at)
TTL toDateTime(recorded_at) + INTERVAL 365 DAY
SETTINGS index_granularity = 8192;

-- ─────────────────────────────────────────────────────────────────────────────
--  Raw Traffic Telemetry
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devtrails_telemetry.traffic_events
(
    event_id        UUID DEFAULT generateUUIDv4(),
    location        String,
    latitude        Float64,
    longitude       Float64,
    severity        UInt8,                      -- 1-5 scale
    congestion_pct  Float32,
    incident_type   LowCardinality(String),     -- 'accident', 'construction', 'closure'
    road_name       String,
    source_api      LowCardinality(String),
    raw_json        String,
    recorded_at     DateTime64(3) DEFAULT now64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(recorded_at)
ORDER BY (location, recorded_at)
TTL toDateTime(recorded_at) + INTERVAL 365 DAY
SETTINGS index_granularity = 8192;

-- ─────────────────────────────────────────────────────────────────────────────
--  Materialized View: Hourly Weather Aggregates
-- ─────────────────────────────────────────────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS devtrails_telemetry.weather_hourly_agg
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (location, hour)
AS
SELECT
    location,
    toStartOfHour(recorded_at) AS hour,
    avg(temperature_f)         AS avg_temp,
    max(wind_speed_mph)        AS max_wind,
    avg(humidity_pct)          AS avg_humidity,
    sum(precipitation)         AS total_precip,
    count()                    AS event_count
FROM devtrails_telemetry.weather_events
GROUP BY location, hour;
