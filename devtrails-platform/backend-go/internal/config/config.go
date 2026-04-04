package config

import "os"

type Config struct {
	Port           string
	PostgresDSN    string
	RedisAddr      string
	KafkaBroker    string
	AIEngineURL    string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		PostgresDSN: getEnv("DATABASE_URL", "postgres://devtrails:devtrails_secret@localhost:55432/devtrails_core?sslmode=disable"),
		RedisAddr:   getEnv("REDIS_ADDR", "localhost:6379"),
		KafkaBroker: getEnv("KAFKA_BROKER", "localhost:9092"),
		AIEngineURL: getEnv("AI_ENGINE_URL", "http://localhost:8000"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
