import json
import os
import random
import time
import uuid
from datetime import datetime, timezone

import schedule
from kafka import KafkaProducer


def get_kafka_producer() -> KafkaProducer:
    broker = os.getenv("KAFKA_BROKER", "kafka:9092")
    return KafkaProducer(
        bootstrap_servers=[broker],
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    )


def mock_openweathermap() -> dict:
    """Mocks a call to OpenWeatherMap returning random rainfall."""
    rainfall = round(random.uniform(0.0, 30.0), 2)
    print(f"[{datetime.now(timezone.utc).isoformat()}] Weather check: {rainfall}mm rainfall")
    return {"rainfall_mm": rainfall}


def check_weather_and_produce() -> None:
    weather_data = mock_openweathermap()
    rainfall = weather_data["rainfall_mm"]

    # Only produce event if rainfall > 15mm
    if rainfall > 15.0:
        event_payload = {
            "event_id": str(uuid.uuid4()),
            "event_type": "heavy_rain",
            "zone": "south_delhi_h3_index",
            "severity": 1.0,
            "timestamp": int(datetime.now(timezone.utc).timestamp()),
        }

        try:
            producer = get_kafka_producer()
            topic = os.getenv("KAFKA_TOPIC_DISRUPTION", "disruption-events")
            producer.send(topic, event_payload)
            producer.flush()
            print(f"ALERT: Heavy rain ({rainfall}mm) > 15mm. Sent disruption event to Kafka: {event_payload}")
        except Exception as e:
            print(f"Failed to send Kafka event: {e}")
    else:
        print(f"Normal conditions ({rainfall}mm). No event triggered.")


def main() -> None:
    print("Oracle Service started. Scheduling weather checks every 10 minutes...")

    # Run once at startup
    check_weather_and_produce()

    # Schedule to run every 10 minutes
    schedule.every(10).minutes.do(check_weather_and_produce)

    # Keep script running
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    main()
