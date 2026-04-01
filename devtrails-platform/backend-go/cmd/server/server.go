package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"github.com/segmentio/kafka-go"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type ServerConfig struct {
	Port                 string
	DatabaseURL          string
	RedisAddr            string
	KafkaBroker          string
	KafkaTopicDisruption string
	KafkaGroupID         string
	AIEngineURL          string
}

type App struct {
	cfg        ServerConfig
	db         *gorm.DB
	redis      *redis.Client
	httpClient *http.Client
}

type User struct {
	ID            string    `gorm:"type:uuid;primaryKey" json:"id"`
	Email         string    `gorm:"uniqueIndex;not null" json:"email"`
	FullName      string    `gorm:"not null" json:"full_name"`
	Zone          string    `gorm:"index;not null" json:"zone"`
	ShiftStart    string    `gorm:"not null" json:"shift_start"`
	ShiftEnd      string    `gorm:"not null" json:"shift_end"`
	Active        bool      `gorm:"index;default:true" json:"active"`
	RiskTier      int       `gorm:"not null;default:3" json:"risk_tier"`
	WeeklyPremium float64   `gorm:"type:numeric(10,2);not null;default:0" json:"weekly_premium"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type RegisterRequest struct {
	Email      string `json:"email" binding:"required,email"`
	FullName   string `json:"full_name" binding:"required"`
	Zone       string `json:"zone" binding:"required"`
	ShiftStart string `json:"shift_start" binding:"required"`
	ShiftEnd   string `json:"shift_end" binding:"required"`
}

type tierRequest struct {
	Zone       string `json:"zone"`
	ShiftStart string `json:"shift_start"`
	ShiftEnd   string `json:"shift_end"`
}

type tierResponse struct {
	Tier          int     `json:"tier"`
	WeeklyPremium float64 `json:"weekly_premium"`
}

type disruptionEvent struct {
	EventID   string  `json:"event_id"`
	Zone      string  `json:"zone"`
	EventType string  `json:"event_type"`
	Severity  float64 `json:"severity"`
}

type frsRequest struct {
	ClaimID            string  `json:"claim_id"`
	ClaimHash          string  `json:"claim_hash"`
	UserID             string  `json:"user_id"`
	Zone               string  `json:"zone"`
	ClaimedAmount      float64 `json:"claimed_amount"`
	AvgWeeklyEarnings  float64 `json:"avg_weekly_earnings"`
	RecentClaims       int     `json:"recent_claims"`
	SharedDeviceCount  int     `json:"shared_device_count"`
	LinkedAccountCount int     `json:"linked_account_count"`
}

type frsResponse struct {
	FRSScore int    `json:"frs_score"`
	Status   string `json:"status"`
}

func main() {
	if err := run(); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func run() error {
	_ = godotenv.Load()

	cfg := ServerConfig{
		Port:                 env("PORT", "8080"),
		DatabaseURL:          env("DATABASE_URL", "postgres://devtrails:devtrails_secret@localhost:5432/devtrails_core?sslmode=disable"),
		RedisAddr:            env("REDIS_ADDR", "localhost:6379"),
		KafkaBroker:          env("KAFKA_BROKER", "localhost:9092"),
		KafkaTopicDisruption: env("KAFKA_TOPIC_DISRUPTION", "disruption-events"),
		KafkaGroupID:         env("KAFKA_GROUP_ID", "core-api-frs-consumer"),
		AIEngineURL:          env("AI_ENGINE_URL", "http://localhost:8000"),
	}

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("postgres connect: %w", err)
	}
	if err := db.AutoMigrate(&User{}); err != nil {
		return fmt.Errorf("automigrate user: %w", err)
	}

	rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisAddr, DB: 0})
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		return fmt.Errorf("redis ping: %w", err)
	}

	app := &App{
		cfg:   cfg,
		db:    db,
		redis: rdb,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go app.consumeDisruptionEvents(ctx)

	router := gin.Default()
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "backend-go-core-api"})
	})
	router.POST("/api/register", app.registerUser)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Printf("core api listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Printf("http server error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("server shutdown: %w", err)
	}
	if err := app.redis.Close(); err != nil {
		return fmt.Errorf("redis close: %w", err)
	}

	return nil
}

func (a *App) registerUser(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tier, premium, err := a.fetchTierFromPython(c.Request.Context(), req.Zone, req.ShiftStart, req.ShiftEnd)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "risk-tier service unavailable", "details": err.Error()})
		return
	}

	user := User{
		ID:            uuid.NewString(),
		Email:         req.Email,
		FullName:      req.FullName,
		Zone:          req.Zone,
		ShiftStart:    req.ShiftStart,
		ShiftEnd:      req.ShiftEnd,
		Active:        true,
		RiskTier:      tier,
		WeeklyPremium: premium,
	}

	if err := a.db.WithContext(c.Request.Context()).Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":             user.ID,
		"email":          user.Email,
		"zone":           user.Zone,
		"tier":           user.RiskTier,
		"weekly_premium": user.WeeklyPremium,
	})
}

func (a *App) fetchTierFromPython(ctx context.Context, zone, shiftStart, shiftEnd string) (int, float64, error) {
	payload := tierRequest{Zone: zone, ShiftStart: shiftStart, ShiftEnd: shiftEnd}
	body, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, a.cfg.AIEngineURL+"/calculate-tier", bytes.NewBuffer(body))
	if err != nil {
		return 0, 0, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return 0, 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, 0, fmt.Errorf("calculate-tier returned status %d", resp.StatusCode)
	}

	var tierRes tierResponse
	if err := json.NewDecoder(resp.Body).Decode(&tierRes); err != nil {
		return 0, 0, err
	}

	return tierRes.Tier, tierRes.WeeklyPremium, nil
}

func (a *App) consumeDisruptionEvents(ctx context.Context) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:  []string{a.cfg.KafkaBroker},
		Topic:    a.cfg.KafkaTopicDisruption,
		GroupID:  a.cfg.KafkaGroupID,
		MinBytes: 1,
		MaxBytes: 10e6,
	})
	defer func() {
		if err := reader.Close(); err != nil {
			log.Printf("kafka reader close error: %v", err)
		}
	}()

	log.Printf("kafka consumer started topic=%s group=%s", a.cfg.KafkaTopicDisruption, a.cfg.KafkaGroupID)

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		msg, err := reader.FetchMessage(ctx)
		if err != nil {
			if errors.Is(err, context.Canceled) {
				return
			}
			log.Printf("kafka fetch error: %v", err)
			time.Sleep(2 * time.Second)
			continue
		}

		var event disruptionEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			log.Printf("invalid disruption event: %v", err)
			_ = reader.CommitMessages(ctx, msg)
			continue
		}

		if event.Zone == "" {
			log.Printf("disruption event missing zone: %s", string(msg.Value))
			_ = reader.CommitMessages(ctx, msg)
			continue
		}

		if err := a.processDisruptionEvent(ctx, event); err != nil {
			log.Printf("process disruption failed event_id=%s err=%v", event.EventID, err)
		}

		if err := reader.CommitMessages(ctx, msg); err != nil {
			log.Printf("commit message failed: %v", err)
		}
	}
}

func (a *App) processDisruptionEvent(ctx context.Context, event disruptionEvent) error {
	var users []User
	if err := a.db.WithContext(ctx).Where("zone = ? AND active = ?", event.Zone, true).Find(&users).Error; err != nil {
		return err
	}

	if len(users) == 0 {
		log.Printf("no active users in zone=%s", event.Zone)
		return nil
	}

	for _, u := range users {
		claimHash := fmt.Sprintf("event:%s:user:%s", event.EventID, u.ID)
		reqPayload := frsRequest{
			ClaimID:            uuid.NewString(),
			ClaimHash:          claimHash,
			UserID:             u.ID,
			Zone:               u.Zone,
			ClaimedAmount:      220 + event.Severity*40,
			AvgWeeklyEarnings:  700,
			RecentClaims:       1,
			SharedDeviceCount:  0,
			LinkedAccountCount: 0,
		}

		resp, err := a.callEvaluateFRS(ctx, reqPayload)
		if err != nil {
			log.Printf("evaluate-frs failed user=%s err=%v", u.ID, err)
			continue
		}

		log.Printf("frs-evaluated user=%s zone=%s score=%d status=%s", u.ID, u.Zone, resp.FRSScore, resp.Status)
	}

	return nil
}

func (a *App) callEvaluateFRS(ctx context.Context, payload frsRequest) (*frsResponse, error) {
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, a.cfg.AIEngineURL+"/evaluate-frs", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("evaluate-frs returned status %d", resp.StatusCode)
	}

	var parsed frsResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, err
	}
	return &parsed, nil
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
