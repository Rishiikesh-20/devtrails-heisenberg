package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/devtrails/backend-go/internal/reports"
	"github.com/devtrails/backend-go/internal/signals"
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
	OpenMeteoBaseURL     string
	PollingLatitude      float64
	PollingLongitude     float64
	PollingZone          string
	PollIntervalMin      int
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
	ShiftStatus   string    `gorm:"index;not null;default:'inactive'" json:"shift_status"`
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
	EventID        string  `json:"event_id"`
	EventType      string  `json:"event_type"`
	Zone           string  `json:"zone"`
	SeverityFactor float64 `json:"severity_factor"`
	Timestamp      int64   `json:"timestamp"`
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

type verifyClaimItem struct {
	UserID             string  `json:"user_id"`
	EventType          string  `json:"event_type"`
	EventTimestamp     int64   `json:"event_timestamp"`
	Zone               string  `json:"zone"`
	ClaimedAmount      float64 `json:"claimed_amount"`
	AvgWeeklyEarnings  float64 `json:"avg_weekly_earnings"`
	RecentClaims       int     `json:"recent_claims"`
	SharedDeviceCount  int     `json:"shared_device_count"`
	LinkedAccountCount int     `json:"linked_account_count"`
}

type ClaimDecision struct {
	UserID   string `json:"user_id"`
	FRSScore int    `json:"frs_score"`
	Decision string `json:"decision"`
}

type AdminMetrics struct {
	TotalActivePolicies int     `json:"total_active_policies"`
	TotalApprovedClaims int     `json:"total_approved_claims"`
	TotalDisbursedINR   float64 `json:"total_disbursed_inr"`
}

func main() {
	if err := run(); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func run() error {
	_ = godotenv.Load()

	pollingLat, _ := strconv.ParseFloat(env("POLLING_LATITUDE", "28.6139"), 64)
	if pollingLat == 0 {
		pollingLat = 28.6139
	}
	pollingLon, _ := strconv.ParseFloat(env("POLLING_LONGITUDE", "77.2090"), 64)
	if pollingLon == 0 {
		pollingLon = 77.2090
	}
	pollIntMin, _ := strconv.Atoi(env("POLL_INTERVAL_MINUTES", "10"))
	if pollIntMin == 0 {
		pollIntMin = 10
	}

	cfg := ServerConfig{
		Port:                 env("PORT", "8080"),
		DatabaseURL:          env("DATABASE_URL", "postgres://devtrails:devtrails_secret@localhost:55432/devtrails_core?sslmode=disable"),
		RedisAddr:            env("REDIS_ADDR", "localhost:6379"),
		KafkaBroker:          env("KAFKA_BROKER", "localhost:9092"),
		KafkaTopicDisruption: env("KAFKA_TOPIC_DISRUPTION", "disruption-events"),
		KafkaGroupID:         env("KAFKA_GROUP_ID", "core-api-frs-consumer"),
		AIEngineURL:          env("AI_ENGINE_URL", "http://localhost:8000"),
		OpenMeteoBaseURL:     env("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1/forecast"),
		PollingLatitude:      pollingLat,
		PollingLongitude:     pollingLon,
		PollingZone:          env("POLLING_ZONE", "south_delhi_h3_index"),
		PollIntervalMin:      pollIntMin,
	}

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("postgres connect: %w", err)
	}
	if err := db.AutoMigrate(&User{}, &signals.WeatherSignal{}, &reports.UserReport{}); err != nil {
		return fmt.Errorf("automigrate: %w", err)
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
	go app.runWeatherPoller(ctx)

	router := gin.Default()
	router.Use(corsMiddleware())
	router.OPTIONS("/*path", func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "backend-go-core-api"})
	})
	router.POST("/api/v1/register", app.registerUser)
	router.POST("/api/v1/reports", app.submitReport)
	router.GET("/api/v1/reports", app.listReports)
	router.GET("/api/v1/admin/metrics", app.getAdminMetrics)
	router.GET("/api/v1/weather", app.listWeather)
	// i aded a new line to checklets see
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
		ShiftStatus:   "active",
		Active:        true,
		RiskTier:      tier,
		WeeklyPremium: premium,
	}

	if err := a.db.WithContext(c.Request.Context()).Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user", "details": err.Error()})
		return
	}

	basePrice := 250.0
	aiRiskDiscount := user.WeeklyPremium - basePrice

	reason := "AI Analysis: Standard risk baseline applied."
	switch user.RiskTier {
	case 1:
		reason = "AI Analysis: Low historical disruption frequency. High reliability zone."
	case 2:
		reason = "AI Analysis: Moderate traffic constraints and seasonal weather risks detected."
	case 3:
		reason = "AI Analysis: High historical vulnerability to waterlogging and platform outages."
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":             user.ID,
		"email":          user.Email,
		"zone":           user.Zone,
		"tier":           user.RiskTier,
		"weekly_premium": user.WeeklyPremium,
		"pricing_breakdown": gin.H{
			"base_price":       basePrice,
			"ai_risk_discount": aiRiskDiscount,
			"final_premium":    user.WeeklyPremium,
			"reason":           reason,
		},
	})
}

func (a *App) getAdminMetrics(c *gin.Context) {
	var metrics AdminMetrics

	if err := a.db.Raw("SELECT COUNT(*) FROM users WHERE active = true;").Scan(&metrics.TotalActivePolicies).Error; err != nil {
		log.Printf("admin metrics query failed total_active_policies err=%v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load admin metrics"})
		return
	}

	if err := a.db.Raw("SELECT COUNT(*) FROM claims WHERE status = 'approved';").Scan(&metrics.TotalApprovedClaims).Error; err != nil {
		log.Printf("admin metrics query failed total_approved_claims err=%v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load admin metrics"})
		return
	}

	var hasLedgers bool
	if err := a.db.Raw("SELECT to_regclass('public.ledgers') IS NOT NULL;").Scan(&hasLedgers).Error; err != nil {
		log.Printf("admin metrics query failed ledgers table check err=%v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load admin metrics"})
		return
	}

	if hasLedgers {
		if err := a.db.Raw("SELECT COALESCE(SUM(balance), 0) FROM ledgers;").Scan(&metrics.TotalDisbursedINR).Error; err != nil {
			log.Printf("admin metrics query failed total_disbursed_inr err=%v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load admin metrics"})
			return
		}
	} else {
		metrics.TotalDisbursedINR = 0
	}

	c.JSON(http.StatusOK, metrics)
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
	if err := a.db.WithContext(ctx).Where("zone = ? AND shift_status = ?", event.Zone, "active").Find(&users).Error; err != nil {
		return err
	}

	if len(users) == 0 {
		log.Printf("no active users in zone=%s", event.Zone)
		return nil
	}

	payoutAmounts := make(map[string]float64, len(users))
	wage := 150.0
	lostHours := 3.0

	batch := make([]verifyClaimItem, 0, len(users))
	for _, u := range users {
		calculatedAmount := lostHours * wage * event.SeverityFactor * 0.80
		payoutAmounts[u.ID] = calculatedAmount

		batch = append(batch, verifyClaimItem{
			UserID:             u.ID,
			EventType:          event.EventType,
			EventTimestamp:     event.Timestamp,
			Zone:               u.Zone,
			ClaimedAmount:      calculatedAmount,
			AvgWeeklyEarnings:  700,
			RecentClaims:       1,
			SharedDeviceCount:  0,
			LinkedAccountCount: 0,
		})
	}

	decisions, err := a.callVerifyClaims(ctx, batch)
	if err != nil {
		return fmt.Errorf("verify-claims failed event_id=%s: %w", event.EventID, err)
	}

	autoApproved := make([]ClaimDecision, 0, len(decisions))
	for _, claim := range decisions {
		if err := RecordClaim(a.db.WithContext(ctx), event.EventID, claim); err != nil {
			log.Printf("record-claim failed event_id=%s user=%s err=%v", event.EventID, claim.UserID, err)
		}

		switch strings.ToUpper(strings.TrimSpace(claim.Decision)) {
		case "AUTO-APPROVE":
			autoApproved = append(autoApproved, claim)
		case "FULL_WITHHOLD", "PARTIAL_HOLD":
			log.Printf("claim held user=%s frs_score=%d decision=%s", claim.UserID, claim.FRSScore, claim.Decision)
		default:
			log.Printf("claim decision unrecognized user=%s frs_score=%d decision=%s", claim.UserID, claim.FRSScore, claim.Decision)
		}
	}

	for _, claim := range autoApproved {
		log.Printf("claim routed to payout user=%s score=%d decision=%s", claim.UserID, claim.FRSScore, claim.Decision)
	}
	log.Printf("event_id=%s routed %d claims to payout", event.EventID, len(autoApproved))

	sqlDB, err := a.db.DB()
	if err != nil {
		return fmt.Errorf("get sql db handle: %w", err)
	}

	for _, claim := range autoApproved {
		amount, ok := payoutAmounts[claim.UserID]
		if !ok {
			log.Printf("payout amount missing for user=%s event_id=%s", claim.UserID, event.EventID)
			continue
		}

		if err := ProcessPayout(sqlDB, claim.UserID, amount); err != nil {
			log.Printf("payout handoff failed user=%s event_id=%s err=%v", claim.UserID, event.EventID, err)
			continue
		}
	}

	return nil
}

func (a *App) callVerifyClaims(ctx context.Context, batch []verifyClaimItem) ([]ClaimDecision, error) {
	body, err := json.Marshal(batch)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, a.cfg.AIEngineURL+"/verify-claims", bytes.NewBuffer(body))
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
		return nil, fmt.Errorf("verify-claims returned status %d", resp.StatusCode)
	}

	rawBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read verify-claims response: %w", err)
	}

	var decisions []ClaimDecision
	if err := json.Unmarshal(rawBody, &decisions); err != nil {
		return nil, fmt.Errorf("unmarshal verify-claims response: %w", err)
	}

	return decisions, nil
}

func RecordClaim(db *gorm.DB, eventID string, claim ClaimDecision) error {
	normalizedDecision := strings.ToUpper(strings.TrimSpace(claim.Decision))
	status := mapClaimStatus(normalizedDecision)

	query := `
		INSERT INTO claims (event_id, user_id, frs_score, decision, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	if err := db.Exec(
		query,
		eventID,
		claim.UserID,
		claim.FRSScore,
		normalizedDecision,
		status,
		time.Now().UTC(),
	).Error; err != nil {
		return fmt.Errorf("insert claim user=%s: %w", claim.UserID, err)
	}

	return nil
}

func mapClaimStatus(decision string) string {
	switch decision {
	case "AUTO-APPROVE":
		return "approved"
	case "FULL_WITHHOLD", "PARTIAL_HOLD":
		return "under_review"
	default:
		return "under_review"
	}
}

func ProcessPayout(db *sql.DB, userID string, amount float64) error {
	// Phase 2 stub for Member 5 handoff.
	// Replace this ledger update with the final payout orchestrator implementation.
	if _, err := db.Exec(
		"UPDATE ledgers SET balance = balance + $2 WHERE user_id = $1;",
		userID,
		amount,
	); err != nil {
		return fmt.Errorf("update ledger user=%s: %w", userID, err)
	}

	log.Printf("SUCCESS: Handed off user %s for payout. Ledger updated by %.2f.", userID, amount)
	return nil
}

func ParseAndRouteClaims(raw []byte) ([]ClaimDecision, error) {
	var decisions []ClaimDecision
	if err := json.Unmarshal(raw, &decisions); err != nil {
		return nil, err
	}

	autoApproved := make([]ClaimDecision, 0, len(decisions))
	for _, claim := range decisions {
		switch strings.ToUpper(strings.TrimSpace(claim.Decision)) {
		case "AUTO-APPROVE":
			autoApproved = append(autoApproved, claim)
		case "FULL_WITHHOLD", "PARTIAL_HOLD":
			log.Printf("claim held user=%s frs_score=%d decision=%s", claim.UserID, claim.FRSScore, claim.Decision)
		default:
			log.Printf("claim decision unrecognized user=%s frs_score=%d decision=%s", claim.UserID, claim.FRSScore, claim.Decision)
		}
	}

	return autoApproved, nil
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

func corsMiddleware() gin.HandlerFunc {
	allowedOrigin := env("CORS_ALLOWED_ORIGIN", "http://localhost:3000")

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == allowedOrigin {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		c.Header("Vary", "Origin")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func (a *App) runWeatherPoller(ctx context.Context) {
	log.Printf("[poller] Starting weather poller interval=%dm zone=%s", a.cfg.PollIntervalMin, a.cfg.PollingZone)
	ticker := time.NewTicker(time.Duration(a.cfg.PollIntervalMin) * time.Minute)
	defer ticker.Stop()

	a.pollAndStoreWeather(ctx)
	for {
		select {
		case <-ctx.Done():
			log.Printf("[poller] Stopping weather poller")
			return
		case <-ticker.C:
			a.pollAndStoreWeather(ctx)
		}
	}
}

func (a *App) pollAndStoreWeather(ctx context.Context) {
	fetchCfg := signals.FetchConfig{
		BaseURL:     a.cfg.OpenMeteoBaseURL,
		Latitude:    a.cfg.PollingLatitude,
		Longitude:   a.cfg.PollingLongitude,
		PollingZone: a.cfg.PollingZone,
	}

	reading, err := signals.FetchWeatherSignal(ctx, a.httpClient, fetchCfg)
	if err != nil {
		log.Printf("[poller] fetch failed: %v", err)
		return
	}

	newID := uuid.NewString()
	_, err = signals.SaveSignal(a.db.WithContext(ctx), reading, newID)
	if err != nil {
		log.Printf("[poller] save failed: %v", err)
		return
	}

	log.Printf("[poller] fetched weather zone=%s precipitation=%.2fmm threshold_crossed=%v",
		reading.Zone, reading.PrecipitationMM, reading.ThresholdCrossed)

	if reading.ThresholdCrossed {
		// Just log for now. Let the Kafka group handle publish if necessary.
		log.Printf("TRIGGER: %s zone=%s precipitation=%.2fmm wind=%.2fkmh",
			reading.EventType, reading.Zone, reading.PrecipitationMM, reading.WindSpeedKMH)
	}
}

func (a *App) listWeather(c *gin.Context) {
	limitStr := c.Query("limit")
	limit, _ := strconv.Atoi(limitStr)
	if limit == 0 {
		limit = 50
	}

	filters := signals.SignalQueryFilters{
		Limit: limit,
	}

	if zone := c.Query("zone"); zone != "" {
		filters.Zone = &zone
	}
	if eventType := c.Query("event_type"); eventType != "" {
		filters.EventType = &eventType
	}
	if trigger := c.Query("triggered"); trigger != "" {
		b, _ := strconv.ParseBool(trigger)
		filters.ThresholdCrossed = &b
	}

	res, err := signals.QuerySignals(a.db.WithContext(c.Request.Context()), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query signals", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  res,
		"count": len(res),
	})
}

type submitReportRequest struct {
	UserID   string `json:"user_id" binding:"required"`
	Zone     string `json:"zone" binding:"required"`
	Category string `json:"category" binding:"required"`
	Severity int    `json:"severity" binding:"required"`
	Details  string `json:"details"`
}

func (a *App) submitReport(c *gin.Context) {
	var req submitReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report := &reports.UserReport{
		ID:         uuid.NewString(),
		UserID:     req.UserID,
		Zone:       req.Zone,
		Category:   req.Category,
		Severity:   req.Severity,
		Details:    req.Details,
		ReportedAt: time.Now().UTC(),
		CreatedAt:  time.Now().UTC(),
	}

	// Calculate Authenticity based on consensus
	if err := reports.EvaluateReport(c.Request.Context(), a.db.WithContext(c.Request.Context()), report); err != nil {
		log.Printf("Failed to evaluate report authenticity: %v", err)
		// non-fatal, proceed with default values
	}

	if err := reports.SaveReport(a.db.WithContext(c.Request.Context()), report); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save report", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":            "report submitted successfully",
		"id":                 report.ID,
		"status":             report.Status,
		"authenticity_score": report.AuthenticityScore,
	})
}

func (a *App) listReports(c *gin.Context) {
	limitStr := c.Query("limit")
	limit, _ := strconv.Atoi(limitStr)
	if limit == 0 {
		limit = 50
	}

	filters := reports.ReportQueryFilters{
		Limit: limit,
	}

	if zone := c.Query("zone"); zone != "" {
		filters.Zone = &zone
	}
	if cat := c.Query("category"); cat != "" {
		filters.Category = &cat
	}
	if status := c.Query("status"); status != "" {
		filters.Status = &status
	}

	res, err := reports.QueryReports(a.db.WithContext(c.Request.Context()), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query reports", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  res,
		"count": len(res),
	})
}
