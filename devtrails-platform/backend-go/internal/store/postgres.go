package store

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/devtrails/backend-go/internal/config"
)

func NewPostgres(cfg *config.Config) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(context.Background(), cfg.PostgresDSN)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(context.Background()); err != nil {
		return nil, err
	}
	return pool, nil
}
