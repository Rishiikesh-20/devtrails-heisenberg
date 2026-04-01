package store

import (
	"github.com/redis/go-redis/v9"

	"github.com/devtrails/backend-go/internal/config"
)

func NewRedis(cfg *config.Config) *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
		DB:   0,
	})
}
