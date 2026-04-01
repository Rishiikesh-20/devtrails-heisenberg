package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Worker struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	Phone     string    `json:"phone,omitempty"`
	Platform  string    `json:"platform,omitempty"`
	City      string    `json:"city,omitempty"`
	State     string    `json:"state,omitempty"`
	ZipCode   string    `json:"zip_code,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

func ListWorkers(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := pool.Query(context.Background(),
			"SELECT id, email, full_name, phone, platform, city, state, zip_code, created_at FROM gig_workers ORDER BY created_at DESC LIMIT 100")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var workers []Worker
		for rows.Next() {
			var w Worker
			if err := rows.Scan(&w.ID, &w.Email, &w.FullName, &w.Phone, &w.Platform, &w.City, &w.State, &w.ZipCode, &w.CreatedAt); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			workers = append(workers, w)
		}
		c.JSON(http.StatusOK, gin.H{"data": workers, "count": len(workers)})
	}
}

type CreateWorkerRequest struct {
	Email    string `json:"email" binding:"required,email"`
	FullName string `json:"full_name" binding:"required"`
	Phone    string `json:"phone"`
	Platform string `json:"platform"`
	City     string `json:"city"`
	State    string `json:"state"`
	ZipCode  string `json:"zip_code"`
}

func CreateWorker(pool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateWorkerRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		id := uuid.New().String()
		_, err := pool.Exec(context.Background(),
			`INSERT INTO gig_workers (id, email, full_name, phone, platform, city, state, zip_code)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			id, req.Email, req.FullName, req.Phone, req.Platform, req.City, req.State, req.ZipCode)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"id": id, "message": "worker created"})
	}
}
