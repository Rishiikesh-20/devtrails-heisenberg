import json
import os
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests
import schedule
from kafka import KafkaProducer
from dotenv import load_dotenv

try:
    import snscrape.modules.twitter as sntwitter
except Exception:
    sntwitter = None


DEFAULT_EVENT_ZONE = "south_delhi"
DEFAULT_LATITUDE = 28.6139
DEFAULT_LONGITUDE = 77.2090
HTTP_TIMEOUT_SECONDS = 12
REPO_ENV_PATH = Path(__file__).resolve().parents[3] / ".env"


CURFEW_KEYWORDS = (
    "curfew",
    "section 144",
    "restriction",
    "barricade",
    "movement ban",
)
FUEL_KEYWORDS = (
    "fuel shortage",
    "lpg shortage",
    "petrol shortage",
    "diesel shortage",
)
OUTAGE_KEYWORDS = (
    "outage",
    "down",
    "downtime",
    "server issue",
)


@dataclass
class OracleConfig:
    kafka_broker: str
    kafka_topic: str
    event_zone: str
    latitude: float
    longitude: float
    destination_latitude: float
    destination_longitude: float
    weather_rain_threshold_mm: float
    traffic_congestion_ratio_threshold: float
    signal_hits_threshold: int
    gdelt_query: str
    gdelt_max_records: int
    gdelt_lookback_hours: int
    social_query: str
    snscrape_limit: int
    openrouteservice_api_key: str
    place_query: str
    nominatim_user_agent: str
    poll_interval_minutes: int


def load_config() -> OracleConfig:
    latitude = parse_env_float("EVENT_LATITUDE", DEFAULT_LATITUDE)
    longitude = parse_env_float("EVENT_LONGITUDE", DEFAULT_LONGITUDE)
    destination_latitude = parse_env_float("EVENT_DEST_LATITUDE", latitude + 0.04)
    destination_longitude = parse_env_float("EVENT_DEST_LONGITUDE", longitude + 0.04)

    return OracleConfig(
        kafka_broker=os.getenv("KAFKA_BROKER", "kafka:9092"),
        kafka_topic=os.getenv("KAFKA_TOPIC_DISRUPTION", "disruption-events"),
        event_zone=normalize_zone(os.getenv("EVENT_ZONE", DEFAULT_EVENT_ZONE)),
        latitude=latitude,
        longitude=longitude,
        destination_latitude=destination_latitude,
        destination_longitude=destination_longitude,
        weather_rain_threshold_mm=parse_env_float("WEATHER_RAIN_THRESHOLD_MM", 15.0),
        traffic_congestion_ratio_threshold=parse_env_float("TRAFFIC_CONGESTION_RATIO_THRESHOLD", 1.6),
        signal_hits_threshold=parse_env_int("SIGNAL_HITS_THRESHOLD", 3),
        gdelt_query=os.getenv(
            "GDELT_QUERY",
            "(curfew OR flood OR outage OR fuel shortage) AND (india OR delhi OR bengaluru OR hyderabad OR mumbai)",
        ),
        gdelt_max_records=parse_env_int("GDELT_MAX_RECORDS", 20),
        gdelt_lookback_hours=parse_env_int("GDELT_LOOKBACK_HOURS", 6),
        social_query=os.getenv("SOCIAL_QUERY", "curfew OR flood OR outage OR lpg shortage"),
        snscrape_limit=parse_env_int("SNSCRAPE_LIMIT", 30),
        openrouteservice_api_key=os.getenv("OPENROUTESERVICE_API_KEY", "").strip(),
        place_query=os.getenv("NOMINATIM_PLACE_QUERY", "fuel station"),
        nominatim_user_agent=os.getenv("NOMINATIM_USER_AGENT", "devtrails-oracle/1.0"),
        poll_interval_minutes=max(parse_env_int("POLL_INTERVAL_MINUTES", 10), 1),
    )


def parse_env_int(key: str, fallback: int) -> int:
    value = os.getenv(key, "").strip()
    if not value:
        return fallback
    try:
        return int(value)
    except ValueError:
        return fallback


def parse_env_float(key: str, fallback: float) -> float:
    value = os.getenv(key, "").strip()
    if not value:
        return fallback
    try:
        return float(value)
    except ValueError:
        return fallback


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def now_iso() -> str:
    return now_utc().isoformat().replace("+00:00", "Z")


def normalize_zone(zone: str) -> str:
    normalized = zone.strip().lower().replace(" ", "_").replace("-", "_")
    return normalized or DEFAULT_EVENT_ZONE


def get_kafka_producer(cfg: OracleConfig) -> KafkaProducer:
    return KafkaProducer(
        bootstrap_servers=[cfg.kafka_broker],
        value_serializer=lambda value: json.dumps(value, separators=(",", ":")).encode("utf-8"),
    )


def count_keyword_hits(text: str) -> dict[str, int]:
    normalized = text.lower()
    return {
        "curfew": sum(1 for token in CURFEW_KEYWORDS if token in normalized),
        "fuel": sum(1 for token in FUEL_KEYWORDS if token in normalized),
        "outage": sum(1 for token in OUTAGE_KEYWORDS if token in normalized),
    }


def merge_keyword_hits(*collections: dict[str, int]) -> dict[str, int]:
    merged = {"curfew": 0, "fuel": 0, "outage": 0}
    for entry in collections:
        for key in merged:
            merged[key] += int(entry.get(key, 0))
    return merged


def fetch_open_meteo_signal(cfg: OracleConfig) -> dict[str, Any]:
    params = {
        "latitude": cfg.latitude,
        "longitude": cfg.longitude,
        "current": "precipitation,rain,windspeed_10m,temperature_2m",
        "timezone": "auto",
        "forecast_days": 1,
    }
    response = requests.get("https://api.open-meteo.com/v1/forecast", params=params, timeout=HTTP_TIMEOUT_SECONDS)
    response.raise_for_status()
    payload = response.json()
    current = payload.get("current", {})

    return {
        "provider": "open_meteo",
        "precipitation_mm": round(float(current.get("precipitation", 0.0)), 2),
        "rain_mm": round(float(current.get("rain", 0.0)), 2),
        "wind_speed_kmh": round(float(current.get("windspeed_10m", 0.0)), 2),
        "temperature_c": round(float(current.get("temperature_2m", 0.0)), 2),
        "threshold_mm": cfg.weather_rain_threshold_mm,
        "sampled_at": now_iso(),
    }


def fetch_gdelt_news_signal(cfg: OracleConfig) -> dict[str, Any]:
    end_time = now_utc()
    start_time = end_time - timedelta(hours=cfg.gdelt_lookback_hours)
    params = {
        "query": cfg.gdelt_query,
        "mode": "ArtList",
        "format": "json",
        "maxrecords": cfg.gdelt_max_records,
        "sort": "DateDesc",
        "startdatetime": start_time.strftime("%Y%m%d%H%M%S"),
        "enddatetime": end_time.strftime("%Y%m%d%H%M%S"),
    }
    response = requests.get("https://api.gdeltproject.org/api/v2/doc/doc", params=params, timeout=HTTP_TIMEOUT_SECONDS)
    response.raise_for_status()

    payload = response.json()
    articles = payload.get("articles", []) if isinstance(payload, dict) else []
    condensed_articles: list[dict[str, Any]] = []
    combined_text_parts: list[str] = []

    for article in articles[: cfg.gdelt_max_records]:
        title = str(article.get("title", "")).strip()
        source = str(article.get("sourcecommonname", "")).strip()
        url = str(article.get("url", "")).strip()
        seen_date = str(article.get("seendate", "")).strip()
        if title:
            combined_text_parts.append(title)
        condensed_articles.append(
            {
                "title": title,
                "url": url,
                "source": source,
                "timestamp": seen_date,
            }
        )

    keyword_hits = count_keyword_hits(" ".join(combined_text_parts))
    return {
        "provider": "gdelt",
        "query": cfg.gdelt_query,
        "article_count": len(articles),
        "keyword_hits": keyword_hits,
        "top_articles": condensed_articles[:5],
        "sampled_at": now_iso(),
    }


def fetch_snscrape_social_signal(cfg: OracleConfig) -> dict[str, Any]:
    if sntwitter is None:
        return {
            "provider": "snscrape",
            "query": cfg.social_query,
            "post_count": 0,
            "keyword_hits": {"curfew": 0, "fuel": 0, "outage": 0},
            "top_posts": [],
            "error": "snscrape_unavailable",
            "sampled_at": now_iso(),
        }

    since_marker = (now_utc() - timedelta(hours=24)).strftime("%Y-%m-%d")
    query = f"({cfg.social_query}) since:{since_marker}"

    posts: list[dict[str, Any]] = []
    text_parts: list[str] = []

    try:
        for idx, tweet in enumerate(sntwitter.TwitterSearchScraper(query).get_items()):
            if idx >= cfg.snscrape_limit:
                break
            content = str(getattr(tweet, "rawContent", "")).strip()
            if content:
                text_parts.append(content)
            posts.append(
                {
                    "source": "twitter",
                    "id": str(getattr(tweet, "id", "")),
                    "author": str(getattr(getattr(tweet, "user", None), "username", "")),
                    "content": content,
                    "url": str(getattr(tweet, "url", "")),
                    "timestamp": str(getattr(tweet, "date", "")),
                }
            )
    except Exception as exc:
        return {
            "provider": "snscrape",
            "query": cfg.social_query,
            "post_count": 0,
            "keyword_hits": {"curfew": 0, "fuel": 0, "outage": 0},
            "top_posts": [],
            "error": f"snscrape_error:{exc}",
            "sampled_at": now_iso(),
        }

    keyword_hits = count_keyword_hits(" ".join(text_parts))
    return {
        "provider": "snscrape",
        "query": cfg.social_query,
        "post_count": len(posts),
        "keyword_hits": keyword_hits,
        "top_posts": posts[:5],
        "sampled_at": now_iso(),
    }


def fetch_social_signal(cfg: OracleConfig) -> dict[str, Any]:
    return fetch_snscrape_social_signal(cfg)


def fetch_geo_context(cfg: OracleConfig) -> dict[str, Any]:
    headers = {"User-Agent": cfg.nominatim_user_agent}
    params = {
        "format": "jsonv2",
        "lat": cfg.latitude,
        "lon": cfg.longitude,
        "zoom": 14,
        "addressdetails": 1,
    }
    response = requests.get(
        "https://nominatim.openstreetmap.org/reverse",
        params=params,
        headers=headers,
        timeout=HTTP_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    payload = response.json()
    address = payload.get("address", {})

    return {
        "provider": "openstreetmap_nominatim",
        "latitude": cfg.latitude,
        "longitude": cfg.longitude,
        "display_name": str(payload.get("display_name", "")),
        "city": str(address.get("city") or address.get("town") or address.get("village") or ""),
        "state": str(address.get("state", "")),
        "country": str(address.get("country", "")),
        "osm_type": str(payload.get("osm_type", "")),
        "osm_id": str(payload.get("osm_id", "")),
        "sampled_at": now_iso(),
    }


def compute_free_flow_seconds(distance_m: float, assumed_kmph: float = 30.0) -> float:
    if distance_m <= 0:
        return 1.0
    assumed_mps = max(assumed_kmph * 1000 / 3600, 1.0)
    return max(distance_m / assumed_mps, 1.0)


def fetch_osrm_routing(cfg: OracleConfig) -> dict[str, Any]:
    route_url = (
        "https://router.project-osrm.org/route/v1/driving/"
        f"{cfg.longitude},{cfg.latitude};{cfg.destination_longitude},{cfg.destination_latitude}"
    )
    response = requests.get(route_url, params={"overview": "false", "steps": "false"}, timeout=HTTP_TIMEOUT_SECONDS)
    response.raise_for_status()
    payload = response.json()
    route = payload.get("routes", [{}])[0]

    distance_m = float(route.get("distance", 0.0))
    duration_s = float(route.get("duration", 0.0))
    free_flow_s = compute_free_flow_seconds(distance_m)
    congestion_ratio = round(duration_s / free_flow_s, 2)

    return {
        "provider": "osrm",
        "distance_m": round(distance_m, 2),
        "duration_s": round(duration_s, 2),
        "estimated_free_flow_s": round(free_flow_s, 2),
        "congestion_ratio": congestion_ratio,
        "threshold_ratio": cfg.traffic_congestion_ratio_threshold,
        "threshold_crossed": congestion_ratio >= cfg.traffic_congestion_ratio_threshold,
        "sampled_at": now_iso(),
    }


def fetch_openrouteservice_routing(cfg: OracleConfig) -> dict[str, Any]:
    if not cfg.openrouteservice_api_key:
        return {
            "provider": "openrouteservice",
            "enabled": False,
            "reason": "missing_openrouteservice_api_key",
            "sampled_at": now_iso(),
        }

    headers = {
        "Authorization": cfg.openrouteservice_api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "coordinates": [
            [cfg.longitude, cfg.latitude],
            [cfg.destination_longitude, cfg.destination_latitude],
        ]
    }
    response = requests.post(
        "https://api.openrouteservice.org/v2/directions/driving-car",
        headers=headers,
        json=payload,
        timeout=HTTP_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    body = response.json()

    route = body.get("routes", [{}])[0]
    summary = route.get("summary", {}) if isinstance(route, dict) else {}

    distance_m = float(summary.get("distance", 0.0))
    duration_s = float(summary.get("duration", 0.0))
    free_flow_s = compute_free_flow_seconds(distance_m)
    congestion_ratio = round(duration_s / free_flow_s, 2)

    return {
        "provider": "openrouteservice",
        "enabled": True,
        "distance_m": round(distance_m, 2),
        "duration_s": round(duration_s, 2),
        "estimated_free_flow_s": round(free_flow_s, 2),
        "congestion_ratio": congestion_ratio,
        "threshold_ratio": cfg.traffic_congestion_ratio_threshold,
        "threshold_crossed": congestion_ratio >= cfg.traffic_congestion_ratio_threshold,
        "sampled_at": now_iso(),
    }


def fetch_places_context(cfg: OracleConfig) -> dict[str, Any]:
    headers = {"User-Agent": cfg.nominatim_user_agent}
    box_delta = 0.08
    params = {
        "q": cfg.place_query,
        "format": "jsonv2",
        "limit": 5,
        "viewbox": (
            f"{cfg.longitude - box_delta},{cfg.latitude + box_delta},"
            f"{cfg.longitude + box_delta},{cfg.latitude - box_delta}"
        ),
        "bounded": 1,
    }

    response = requests.get(
        "https://nominatim.openstreetmap.org/search",
        params=params,
        headers=headers,
        timeout=HTTP_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    payload = response.json()

    matches = []
    for item in payload[:5]:
        matches.append(
            {
                "display_name": str(item.get("display_name", "")),
                "lat": str(item.get("lat", "")),
                "lon": str(item.get("lon", "")),
                "class": str(item.get("class", "")),
                "type": str(item.get("type", "")),
            }
        )

    return {
        "provider": "nominatim",
        "query": cfg.place_query,
        "match_count": len(matches),
        "matches": matches,
        "sampled_at": now_iso(),
    }


def pick_event_trigger(
    cfg: OracleConfig,
    weather: dict[str, Any],
    news: dict[str, Any],
    social: dict[str, Any],
    routing: dict[str, Any],
) -> tuple[str, float, str] | None:
    if float(weather.get("precipitation_mm", 0.0)) >= cfg.weather_rain_threshold_mm:
        return ("heavy_rain", 1.0, "open_meteo")

    news_hits = news.get("keyword_hits", {})
    social_hits = social.get("keyword_hits", {})

    curfew_hits = int(news_hits.get("curfew", 0)) + int(social_hits.get("curfew", 0))
    fuel_hits = int(news_hits.get("fuel", 0)) + int(social_hits.get("fuel", 0))
    outage_hits = int(news_hits.get("outage", 0)) + int(social_hits.get("outage", 0))

    if curfew_hits >= cfg.signal_hits_threshold:
        return ("curfew", 1.2, "multi_source")

    if fuel_hits >= cfg.signal_hits_threshold:
        return ("fuel_shortage", 0.65, "multi_source")

    if outage_hits >= cfg.signal_hits_threshold:
        return ("platform_outage", 1.0, "multi_source")

    osrm_signal = routing.get("osrm", {})
    ors_signal = routing.get("openrouteservice", {})
    if bool(osrm_signal.get("threshold_crossed")) or bool(ors_signal.get("threshold_crossed")):
        source = "openrouteservice" if bool(ors_signal.get("threshold_crossed")) else "osrm"
        return ("traffic_disruption", 0.5, source)

    return None


def build_evidence(news: dict[str, Any], social: dict[str, Any]) -> list[dict[str, Any]]:
    evidence: list[dict[str, Any]] = []

    for article in news.get("top_articles", [])[:3]:
        evidence.append(
            {
                "type": "news",
                "source": str(article.get("source", "gdelt") or "gdelt"),
                "title": str(article.get("title", "")),
                "url": str(article.get("url", "")),
                "timestamp": str(article.get("timestamp", "")),
            }
        )

    for post in social.get("top_posts", [])[:3]:
        evidence.append(
            {
                "type": "social",
                "source": str(post.get("source", "social")),
                "title": str(post.get("content", ""))[:180],
                "url": str(post.get("url", "")),
                "timestamp": str(post.get("timestamp", "")),
            }
        )

    return evidence


def build_event_payload(
    cfg: OracleConfig,
    event_type: str,
    severity_factor: float,
    source: str,
    weather: dict[str, Any],
    news: dict[str, Any],
    social: dict[str, Any],
    geo: dict[str, Any],
    routing: dict[str, Any],
    places: dict[str, Any],
) -> dict[str, Any]:
    return {
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "zone_id": cfg.event_zone,
        "severity_factor": severity_factor,
        "triggered_at": now_iso(),
        "source": source,
        "ingestion": {
            "weather": weather,
            "news": news,
            "social": social,
        },
        "geo": geo,
        "routing": routing,
        "places": places,
        "evidence": build_evidence(news, social),
    }


def gather_signals(
    cfg: OracleConfig,
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any]]:
    weather = fetch_open_meteo_signal(cfg)

    try:
        news = fetch_gdelt_news_signal(cfg)
    except Exception as exc:
        news = {
            "provider": "gdelt",
            "query": cfg.gdelt_query,
            "article_count": 0,
            "keyword_hits": {"curfew": 0, "fuel": 0, "outage": 0},
            "top_articles": [],
            "error": f"gdelt_error:{exc}",
            "sampled_at": now_iso(),
        }

    try:
        social = fetch_social_signal(cfg)
    except Exception as exc:
        social = {
            "provider": "snscrape",
            "query": cfg.social_query,
            "post_count": 0,
            "keyword_hits": {"curfew": 0, "fuel": 0, "outage": 0},
            "top_posts": [],
            "error": f"social_error:{exc}",
            "sampled_at": now_iso(),
        }

    try:
        geo = fetch_geo_context(cfg)
    except Exception as exc:
        geo = {
            "provider": "openstreetmap_nominatim",
            "latitude": cfg.latitude,
            "longitude": cfg.longitude,
            "display_name": "",
            "city": "",
            "state": "",
            "country": "",
            "osm_type": "",
            "osm_id": "",
            "error": f"geo_error:{exc}",
            "sampled_at": now_iso(),
        }

    routing: dict[str, Any] = {}
    try:
        routing["osrm"] = fetch_osrm_routing(cfg)
    except Exception as exc:
        routing["osrm"] = {
            "provider": "osrm",
            "threshold_crossed": False,
            "error": f"osrm_error:{exc}",
            "sampled_at": now_iso(),
        }

    try:
        routing["openrouteservice"] = fetch_openrouteservice_routing(cfg)
    except Exception as exc:
        routing["openrouteservice"] = {
            "provider": "openrouteservice",
            "enabled": False,
            "threshold_crossed": False,
            "error": f"openrouteservice_error:{exc}",
            "sampled_at": now_iso(),
        }

    routing["destination"] = {
        "latitude": cfg.destination_latitude,
        "longitude": cfg.destination_longitude,
    }

    try:
        places = fetch_places_context(cfg)
    except Exception as exc:
        places = {
            "provider": "nominatim",
            "query": cfg.place_query,
            "match_count": 0,
            "matches": [],
            "error": f"places_error:{exc}",
            "sampled_at": now_iso(),
        }

    return weather, news, social, geo, routing, places


def run_ingestion_cycle(cfg: OracleConfig, producer: KafkaProducer) -> None:
    weather, news, social, geo, routing, places = gather_signals(cfg)

    trigger = pick_event_trigger(cfg, weather, news, social, routing)
    if trigger is None:
        print(
            "No disruption trigger. "
            f"rain_mm={weather.get('precipitation_mm', 0)} "
            f"curfew_hits={social.get('keyword_hits', {}).get('curfew', 0) + news.get('keyword_hits', {}).get('curfew', 0)}"
        )
        return

    event_type, severity_factor, source = trigger
    event_payload = build_event_payload(
        cfg,
        event_type,
        severity_factor,
        source,
        weather,
        news,
        social,
        geo,
        routing,
        places,
    )

    producer.send(cfg.kafka_topic, event_payload)
    producer.flush()
    print(
        "Published disruption event "
        f"event_id={event_payload['event_id']} event_type={event_type} source={source} zone={cfg.event_zone}"
    )


def main() -> None:
    load_dotenv(REPO_ENV_PATH, override=False)
    load_dotenv(override=False)
    cfg = load_config()
    producer = get_kafka_producer(cfg)

    print(
        "Oracle Service started with integrations: "
        "Open-Meteo, GDELT, snscrape, OSRM, OpenRouteService, Nominatim"
    )

    run_ingestion_cycle(cfg, producer)

    schedule.every(cfg.poll_interval_minutes).minutes.do(run_ingestion_cycle, cfg, producer)
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    main()
