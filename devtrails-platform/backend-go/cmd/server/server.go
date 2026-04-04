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
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/devtrails/backend-go/internal/downtime"
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
	FraudEngineURL       string
	StripeSecretKey      string
	StripeCurrency       string
	StripePaymentMethod  string
}

type App struct {
	cfg        ServerConfig
	db         *gorm.DB
	redis      *redis.Client
	httpClient *http.Client
	validator  *ContractValidator
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
	WagePerHour   float64   `gorm:"type:numeric(10,2);not null;default:150" json:"wage_per_hour"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type RegisterRequest struct {
	Email       string   `json:"email" binding:"required,email"`
	FullName    string   `json:"full_name" binding:"required"`
	Zone        string   `json:"zone" binding:"required"`
	ShiftStart  string   `json:"shift_start" binding:"required"`
	ShiftEnd    string   `json:"shift_end" binding:"required"`
	WagePerHour *float64 `json:"wage_per_hour,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type riskQuoteRequest struct {
	Zone       string `json:"zone" binding:"required"`
	ShiftStart string `json:"shift_start" binding:"required"`
	ShiftEnd   string `json:"shift_end" binding:"required"`
}

type simulateDisruptionRequest struct {
	EventType      string   `json:"event_type" binding:"required"`
	ZoneID         string   `json:"zone_id" binding:"required"`
	SeverityFactor *float64 `json:"severity_factor,omitempty"`
	TriggeredAt    string   `json:"triggered_at,omitempty"`
	EventID        string   `json:"event_id,omitempty"`
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

type disruptionKeywordHits struct {
	Curfew int `json:"curfew"`
	Fuel   int `json:"fuel"`
	Outage int `json:"outage"`
}

type disruptionNewsArticle struct {
	Title     string `json:"title"`
	URL       string `json:"url"`
	Source    string `json:"source"`
	Timestamp string `json:"timestamp"`
}

type disruptionSocialPost struct {
	Source    string `json:"source"`
	Content   string `json:"content"`
	URL       string `json:"url"`
	Timestamp string `json:"timestamp"`
}

type disruptionWeatherIngestion struct {
	Provider        string  `json:"provider"`
	PrecipitationMM float64 `json:"precipitation_mm"`
	RainMM          float64 `json:"rain_mm"`
	WindSpeedKMH    float64 `json:"wind_speed_kmh"`
	TemperatureC    float64 `json:"temperature_c"`
	ThresholdMM     float64 `json:"threshold_mm"`
	SampledAt       string  `json:"sampled_at"`
	Error           string  `json:"error,omitempty"`
}

type disruptionNewsIngestion struct {
	Provider     string                  `json:"provider"`
	Query        string                  `json:"query"`
	ArticleCount int                     `json:"article_count"`
	KeywordHits  disruptionKeywordHits   `json:"keyword_hits"`
	TopArticles  []disruptionNewsArticle `json:"top_articles"`
	SampledAt    string                  `json:"sampled_at"`
	Error        string                  `json:"error,omitempty"`
}

type disruptionSocialIngestion struct {
	Provider    string                 `json:"provider"`
	Query       string                 `json:"query"`
	PostCount   int                    `json:"post_count"`
	KeywordHits disruptionKeywordHits  `json:"keyword_hits"`
	TopPosts    []disruptionSocialPost `json:"top_posts"`
	SampledAt   string                 `json:"sampled_at"`
	Error       string                 `json:"error,omitempty"`
}

type disruptionIngestion struct {
	Weather disruptionWeatherIngestion `json:"weather"`
	News    disruptionNewsIngestion    `json:"news"`
	Social  disruptionSocialIngestion  `json:"social"`
}

type disruptionGeoContext struct {
	Provider    string  `json:"provider"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	DisplayName string  `json:"display_name"`
	City        string  `json:"city"`
	State       string  `json:"state"`
	Country     string  `json:"country"`
	SampledAt   string  `json:"sampled_at"`
	Error       string  `json:"error,omitempty"`
}

type disruptionRouteSignal struct {
	Provider         string  `json:"provider"`
	DistanceM        float64 `json:"distance_m"`
	DurationS        float64 `json:"duration_s"`
	FreeFlowS        float64 `json:"estimated_free_flow_s"`
	CongestionRatio  float64 `json:"congestion_ratio"`
	ThresholdRatio   float64 `json:"threshold_ratio"`
	ThresholdCrossed bool    `json:"threshold_crossed"`
	Enabled          bool    `json:"enabled"`
	Reason           string  `json:"reason,omitempty"`
	SampledAt        string  `json:"sampled_at"`
	Error            string  `json:"error,omitempty"`
}

type disruptionRoutingDestination struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type disruptionRouting struct {
	OSRM             disruptionRouteSignal        `json:"osrm"`
	OpenRouteService disruptionRouteSignal        `json:"openrouteservice"`
	Destination      disruptionRoutingDestination `json:"destination"`
}

type disruptionPlaceMatch struct {
	DisplayName string `json:"display_name"`
	Lat         string `json:"lat"`
	Lon         string `json:"lon"`
	Class       string `json:"class"`
	Type        string `json:"type"`
}

type disruptionPlaces struct {
	Provider   string                 `json:"provider"`
	Query      string                 `json:"query"`
	MatchCount int                    `json:"match_count"`
	Matches    []disruptionPlaceMatch `json:"matches"`
	SampledAt  string                 `json:"sampled_at"`
	Error      string                 `json:"error,omitempty"`
}

type disruptionEvidence struct {
	Type      string `json:"type"`
	Source    string `json:"source"`
	Title     string `json:"title"`
	URL       string `json:"url"`
	Timestamp string `json:"timestamp"`
}

type disruptionEvent struct {
	EventID        string                `json:"event_id"`
	EventType      string                `json:"event_type"`
	ZoneID         string                `json:"zone_id"`
	SeverityFactor float64               `json:"severity_factor"`
	TriggeredAt    string                `json:"triggered_at"`
	Source         string                `json:"source"`
	Ingestion      *disruptionIngestion  `json:"ingestion,omitempty"`
	Geo            *disruptionGeoContext `json:"geo,omitempty"`
	Routing        *disruptionRouting    `json:"routing,omitempty"`
	Places         *disruptionPlaces     `json:"places,omitempty"`
	Evidence       []disruptionEvidence  `json:"evidence,omitempty"`
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
		FraudEngineURL:       env("FRAUD_ENGINE_URL", "http://localhost:8001"),
		StripeSecretKey:      env("STRIPE_SECRET_KEY", ""),
		StripeCurrency:       env("STRIPE_CURRENCY", "inr"),
		StripePaymentMethod:  env("STRIPE_PAYMENT_METHOD", "pm_card_visa"),
	}

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("postgres connect: %w", err)
	}
	if err := db.AutoMigrate(&User{}, &signals.WeatherSignal{}, &reports.UserReport{}, &downtime.ServiceHealth{}); err != nil {
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

	contractValidationEnabled := strings.EqualFold(strings.TrimSpace(env("CONTRACT_VALIDATION_ENABLED", "true")), "true")
	if contractValidationEnabled {
		contractsDir := env("CONTRACTS_DIR", "../../contracts")
		validator, err := NewContractValidator(contractsDir)
		if err != nil {
			return fmt.Errorf("contract validator setup failed: %w", err)
		}
		app.validator = validator
		log.Printf("contract validation enabled contracts_dir=%s", contractsDir)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go app.consumeDisruptionEvents(ctx)
	go app.runWeatherPoller(ctx)
	go downtime.StartPoller(db)

	router := gin.Default()
	router.Use(corsMiddleware())
	router.Use(ResponseSchemaValidationMiddleware(app.validator))
	router.OPTIONS("/*path", func(c *gin.Context) {
		c.Status(http.StatusNoContent)
	})
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "backend-go-core-api"})
	})
	router.POST("/api/v1/register", app.registerUser)
	router.POST("/api/v1/login", app.loginUser)
	router.POST("/api/v1/risk/quote", app.quoteRisk)
	router.POST("/api/v1/simulate-event", app.simulateDisruptionEvent)
	router.POST("/api/v1/reports", app.submitReport)
	router.GET("/api/v1/reports", app.listReports)
	router.GET("/api/v1/admin/metrics", app.getAdminMetrics)
	router.GET("/api/v1/weather", app.listWeather)
	router.POST("/api/register", app.registerUser)
	router.POST("/api/login", app.loginUser)
	router.POST("/api/risk/quote", app.quoteRisk)
	router.POST("/api/simulate-event", app.simulateDisruptionEvent)
	router.GET("/api/admin/metrics", app.getAdminMetrics)
	router.GET("/api/signals", app.listWeather)
	router.GET("/wallet", app.getWallet)
	router.GET("/payouts", app.listPayouts)
	router.GET("/claims", app.listClaims)
	router.GET("/api/wallet", app.getWallet)
	router.GET("/api/payouts", app.listPayouts)
	router.GET("/api/claims", app.listClaims)
	router.GET("/api/v1/isitdown", app.checkDowntime)
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

	wagePerHour := defaultWagePerHour
	if req.WagePerHour != nil {
		if *req.WagePerHour < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "wage_per_hour must be non-negative"})
			return
		}
		wagePerHour = *req.WagePerHour
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
		WagePerHour:   wagePerHour,
	}

	if err := a.db.WithContext(c.Request.Context()).Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, buildAuthPayload(user))
}

func (a *App) loginUser(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	var user User
	err := a.db.WithContext(c.Request.Context()).
		Where("LOWER(email) = ?", email).
		First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
			return
		}
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			c.Status(499)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load user", "details": err.Error()})
		return
	}

	// This MVP does not persist password hashes yet; keep route contract for frontend compatibility.
	c.JSON(http.StatusOK, buildAuthPayload(user))
}

func (a *App) quoteRisk(c *gin.Context) {
	var req riskQuoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tier, premium, err := a.fetchTierFromPython(c.Request.Context(), req.Zone, req.ShiftStart, req.ShiftEnd)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "risk-tier service unavailable", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"zone":              req.Zone,
		"shift_start":       req.ShiftStart,
		"shift_end":         req.ShiftEnd,
		"tier":              tier,
		"weekly_premium":    premium,
		"pricing_breakdown": buildPricingBreakdown(tier, premium),
	})
}

func (a *App) simulateDisruptionEvent(c *gin.Context) {
	var req simulateDisruptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	severity := 1.0
	if req.SeverityFactor != nil {
		if *req.SeverityFactor <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "severity_factor must be greater than zero"})
			return
		}
		severity = *req.SeverityFactor
	}

	eventID := strings.TrimSpace(req.EventID)
	if eventID == "" {
		eventID = uuid.NewString()
	}

	triggeredAt := strings.TrimSpace(req.TriggeredAt)
	if triggeredAt == "" {
		triggeredAt = time.Now().UTC().Format(time.RFC3339)
	} else if _, err := time.Parse(time.RFC3339, triggeredAt); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "triggered_at must be RFC3339 format"})
		return
	}

	event := disruptionEvent{
		EventID:        eventID,
		EventType:      strings.TrimSpace(req.EventType),
		ZoneID:         strings.TrimSpace(req.ZoneID),
		SeverityFactor: severity,
		TriggeredAt:    triggeredAt,
		Source:         "frontend-demo",
	}

	if event.EventType == "" || event.ZoneID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_type and zone_id are required"})
		return
	}

	if err := a.processDisruptionEvent(c.Request.Context(), event); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process disruption event", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "disruption event processed",
		"event_id":        event.EventID,
		"event_type":      event.EventType,
		"zone_id":         event.ZoneID,
		"severity_factor": event.SeverityFactor,
		"triggered_at":    event.TriggeredAt,
	})
}

func buildPricingBreakdown(riskTier int, weeklyPremium float64) gin.H {
	basePrice := 250.0
	aiRiskDiscount := weeklyPremium - basePrice

	reason := "AI Analysis: Standard risk baseline applied."
	switch riskTier {
	case 1:
		reason = "AI Analysis: Low historical disruption frequency. High reliability zone."
	case 2:
		reason = "AI Analysis: Moderate traffic constraints and seasonal weather risks detected."
	case 3:
		reason = "AI Analysis: High historical vulnerability to waterlogging and platform outages."
	}

	return gin.H{
		"base_price":       basePrice,
		"ai_risk_discount": aiRiskDiscount,
		"final_premium":    weeklyPremium,
		"reason":           reason,
	}
}

func buildAuthPayload(user User) gin.H {
	return gin.H{
		"id":                user.ID,
		"email":             user.Email,
		"full_name":         user.FullName,
		"zone":              user.Zone,
		"shift_start":       user.ShiftStart,
		"shift_end":         user.ShiftEnd,
		"tier":              user.RiskTier,
		"weekly_premium":    user.WeeklyPremium,
		"wage_per_hour":     user.WagePerHour,
		"pricing_breakdown": buildPricingBreakdown(user.RiskTier, user.WeeklyPremium),
	}
}

func (a *App) getAdminMetrics(c *gin.Context) {
	var metrics AdminMetrics

	if err := a.db.Raw("SELECT COUNT(*) FROM users WHERE active = true;").Scan(&metrics.TotalActivePolicies).Error; err != nil {
		log.Printf("admin metrics query failed total_active_policies err=%v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load admin metrics"})
		return
	}

	var hasClaims bool
	if err := a.db.Raw("SELECT to_regclass('public.claims') IS NOT NULL;").Scan(&hasClaims).Error; err != nil {
		log.Printf("admin metrics query failed claims table check err=%v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load admin metrics"})
		return
	}

	if hasClaims {
		if err := a.db.Raw("SELECT COUNT(*) FROM claims WHERE status = 'approved';").Scan(&metrics.TotalApprovedClaims).Error; err != nil {
			log.Printf("admin metrics query failed total_approved_claims err=%v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load admin metrics"})
			return
		}
	} else {
		metrics.TotalApprovedClaims = 0
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
		if a.validator != nil {
			if err := a.validator.ValidateBytes(contractSchemaEventPayload, msg.Value); err != nil {
				log.Printf("invalid disruption event contract payload: %v", err)
				_ = reader.CommitMessages(ctx, msg)
				continue
			}
		}

		if err := json.Unmarshal(msg.Value, &event); err != nil {
			log.Printf("invalid disruption event: %v", err)
			_ = reader.CommitMessages(ctx, msg)
			continue
		}

		if event.ZoneID == "" {
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
	if err := a.db.WithContext(ctx).Where("zone = ? AND shift_status = ?", event.ZoneID, "active").Find(&users).Error; err != nil {
		return err
	}

	if len(users) == 0 {
		log.Printf("no active users in zone=%s", event.ZoneID)
		return nil
	}

	timestamp := time.Now().UTC().Unix()
	if parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(event.TriggeredAt)); err == nil {
		timestamp = parsed.UTC().Unix()
	}

	eventID := strings.TrimSpace(event.EventID)
	if eventID == "" {
		eventID = uuid.NewString()
	}

	eventForPayout := Event{
		ID:             eventID,
		Type:           event.EventType,
		SeverityFactor: event.SeverityFactor,
		Timestamp:      timestamp,
	}

	usersByID := make(map[string]User, len(users))
	payoutAmounts := make(map[string]float64, len(users))

	batch := make([]Claim, 0, len(users))
	for _, u := range users {
		usersByID[u.ID] = u

		policyStartAt := u.CreatedAt.Unix()
		minimumPolicyAgeSeconds := int64((72 * time.Hour) / time.Second)
		oldestAllowedStart := timestamp - minimumPolicyAgeSeconds
		if policyStartAt == 0 || policyStartAt > oldestAllowedStart {
			policyStartAt = oldestAllowedStart
		}

		calculatedAmount, calcErr := CalculatePayout(u, eventForPayout)
		if calcErr != nil {
			log.Printf("calculate payout failed user=%s event_id=%s err=%v", u.ID, eventID, calcErr)
			continue
		}

		if calculatedAmount <= 0 {
			log.Printf("skipping zero-value payout candidate user=%s event_id=%s", u.ID, eventID)
			continue
		}

		payoutAmounts[u.ID] = calculatedAmount
		currency := strings.ToLower(strings.TrimSpace(a.cfg.StripeCurrency))
		if currency == "" {
			currency = defaultPayoutCurrencyLower
		}

		batch = append(batch, Claim{
			ClaimID:           uuid.NewString(),
			WorkerID:          u.ID,
			PolicyID:          u.ID,
			PolicyStartedAt:   time.Unix(policyStartAt, 0).UTC(),
			IsRenewal:         false,
			ClaimedAmount:     calculatedAmount,
			Currency:          currency,
			AvgWeeklyEarnings: 700,
			RecentClaims:      1,
			DeviceLinkCount:   0,
			AccountLinkCount:  0,
		})
	}

	if len(batch) == 0 {
		log.Printf("no eligible payout claims after validation event_id=%s", eventID)
		return nil
	}

	decisions, err := a.callVerifyClaims(ctx, eventID, event.EventType, event.ZoneID, batch)
	if err != nil {
		return fmt.Errorf("verify-claims failed event_id=%s: %w", eventID, err)
	}

	autoApproved := make([]FRSResult, 0, len(decisions))
	for _, claim := range decisions {
		if err := RecordClaim(a.db.WithContext(ctx), eventID, claim); err != nil {
			log.Printf("record-claim failed event_id=%s worker_id=%s err=%v", eventID, claim.WorkerID, err)
		}

		switch normalizeDecision(claim.Decision) {
		case "auto_approve":
			autoApproved = append(autoApproved, claim)
		case "full_withhold", "partial_hold":
			log.Printf("claim held worker_id=%s frs_score=%d decision=%s", claim.WorkerID, claim.FRSScore, claim.Decision)
		default:
			log.Printf("claim decision unrecognized worker_id=%s frs_score=%d decision=%s", claim.WorkerID, claim.FRSScore, claim.Decision)
		}
	}

	for _, claim := range autoApproved {
		log.Printf("claim routed to payout worker_id=%s score=%d decision=%s", claim.WorkerID, claim.FRSScore, claim.Decision)
	}
	log.Printf("event_id=%s routed %d claims to payout", eventID, len(autoApproved))

	for _, claim := range autoApproved {
		_, ok := payoutAmounts[claim.WorkerID]
		if !ok {
			log.Printf("payout amount missing for worker_id=%s event_id=%s", claim.WorkerID, eventID)
			continue
		}

		user, ok := usersByID[claim.WorkerID]
		if !ok {
			log.Printf("user context missing for payout worker_id=%s event_id=%s", claim.WorkerID, eventID)
			continue
		}

		paidAmount, payoutErr := a.ProcessPayout(ctx, user, eventForPayout, claim)
		if payoutErr != nil {
			log.Printf("payout failed worker_id=%s event_id=%s err=%v", claim.WorkerID, eventID, payoutErr)
			continue
		}

		log.Printf("payout completed worker_id=%s event_id=%s amount=%.2f", claim.WorkerID, eventID, paidAmount)
	}

	return nil
}

func (a *App) callVerifyClaims(ctx context.Context, eventID string, eventType string, zoneID string, claims []Claim) ([]FRSResult, error) {
	results, err := SendBatchClaimsToFraudEngine(ctx, a.httpClient, a.cfg.FraudEngineURL, eventID, eventType, zoneID, claims, a.validator)
	if err != nil {
		return nil, err
	}

	return results, nil
}

func RecordClaim(db *gorm.DB, eventID string, claim FRSResult) error {
	normalizedDecision := normalizeDecision(claim.Decision)
	status := mapClaimStatus(normalizedDecision)

	query := `
		INSERT INTO claims (id, event_id, user_id, frs_score, decision, status, created_at)
		VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
	`

	claimID := strings.TrimSpace(claim.ClaimID)
	if claimID == "" {
		claimID = uuid.NewString()
	}

	if err := db.Exec(
		query,
		claimID,
		eventID,
		claim.WorkerID,
		claim.FRSScore,
		normalizedDecision,
		status,
		time.Now().UTC(),
	).Error; err != nil {
		return fmt.Errorf("insert claim worker_id=%s: %w", claim.WorkerID, err)
	}

	return nil
}

func mapClaimStatus(decision string) string {
	switch decision {
	case "auto_approve":
		return "approved"
	case "full_withhold", "partial_hold":
		return "under_review"
	default:
		return "under_review"
	}
}

func ParseAndRouteClaims(raw []byte) ([]FRSResult, error) {
	if len(raw) == 0 {
		return []FRSResult{}, nil
	}

	var wrapped BatchFRSResponse
	if err := json.Unmarshal(raw, &wrapped); err == nil {
		if wrapped.Results != nil || bytes.Contains(raw, []byte(`"results"`)) {
			return filterAutoApprovedClaims(wrapped.Results), nil
		}
	}

	var decisions []FRSResult
	if err := json.Unmarshal(raw, &decisions); err != nil {
		return nil, err
	}

	return filterAutoApprovedClaims(decisions), nil
}

func filterAutoApprovedClaims(decisions []FRSResult) []FRSResult {
	autoApproved := make([]FRSResult, 0, len(decisions))
	for _, claim := range decisions {
		switch normalizeDecision(claim.Decision) {
		case "auto_approve":
			autoApproved = append(autoApproved, claim)
		case "full_withhold", "partial_hold":
			log.Printf("claim held worker_id=%s frs_score=%d decision=%s", claim.WorkerID, claim.FRSScore, claim.Decision)
		default:
			log.Printf("claim decision unrecognized worker_id=%s frs_score=%d decision=%s", claim.WorkerID, claim.FRSScore, claim.Decision)
		}
	}

	return autoApproved
}

func normalizeDecision(decision string) string {
	normalized := strings.ToLower(strings.TrimSpace(decision))
	normalized = strings.ReplaceAll(normalized, "-", "_")
	if normalized == "autoapprove" {
		return "auto_approve"
	}
	if normalized == "partialhold" {
		return "partial_hold"
	}
	if normalized == "fullwithhold" {
		return "full_withhold"
	}
	return normalized
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
	locations := []signals.FetchConfig{
		{BaseURL: a.cfg.OpenMeteoBaseURL, Latitude: a.cfg.PollingLatitude, Longitude: a.cfg.PollingLongitude, PollingZone: a.cfg.PollingZone},
		{BaseURL: a.cfg.OpenMeteoBaseURL, Latitude: 12.9279, Longitude: 77.6271, PollingZone: "koramangala_blr"},
		{BaseURL: a.cfg.OpenMeteoBaseURL, Latitude: 19.1136, Longitude: 72.8697, PollingZone: "andheri_mum"},
		{BaseURL: a.cfg.OpenMeteoBaseURL, Latitude: 13.0418, Longitude: 80.2341, PollingZone: "t_nagar_che"},
		{BaseURL: a.cfg.OpenMeteoBaseURL, Latitude: 17.4435, Longitude: 78.3772, PollingZone: "hitech_city_hyd"},
	}

	for _, fetchCfg := range locations {
		reading, err := signals.FetchWeatherSignal(ctx, a.httpClient, fetchCfg)
		if err != nil {
			log.Printf("[poller] fetch failed for zone %s: %v", fetchCfg.PollingZone, err)
			continue
		}

		newID := uuid.NewString()
		_, err = signals.SaveSignal(a.db.WithContext(ctx), reading, newID)
		if err != nil {
			log.Printf("[poller] save failed for zone %s: %v", fetchCfg.PollingZone, err)
			continue
		}

		log.Printf("[poller] fetched weather zone=%s precipitation=%.2fmm threshold_crossed=%v",

			reading.Zone, reading.PrecipitationMM, reading.ThresholdCrossed)

		if reading.ThresholdCrossed {
			log.Printf("TRIGGER: %s zone=%s precipitation=%.2fmm wind=%.2fkmh",
				reading.EventType, reading.Zone, reading.PrecipitationMM, reading.WindSpeedKMH)
		}
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

func (a *App) checkDowntime(c *gin.Context) {
	service := c.Query("service")
	zone := c.Query("zone")

	if service == "" || zone == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "service and zone are required"})
		return
	}

	// 1. Get automated ping status
	health, err := downtime.GetLatestHealth(a.db, service, zone)

	// 2. See if multiple users have reported downtime for this service & zone
	// in the last 15 minutes.
	var userReportCount int64
	fifteenMinsAgo := time.Now().UTC().Add(-15 * time.Minute)

	// Details or Category should match 'downtime' or 'service'
	a.db.Model(&reports.UserReport{}).
		Where("zone = ? AND category = ? AND reported_at >= ?", zone, "downtime", fifteenMinsAgo).
		Count(&userReportCount)

	// Decide overall status
	isDown := false
	statusMsg := "operational"

	if err == nil {
		if !health.IsUp {
			isDown = true
			statusMsg = "down_via_automated_check"
		}
	} else {
		// No automated health record yet
		health.StatusCode = 0
		health.LatencyMs = 0
	}

	if !isDown && userReportCount >= 3 {
		// If automated check missed it, but users are screaming it's down!
		isDown = true
		statusMsg = "down_via_user_reports"
	}

	c.JSON(http.StatusOK, gin.H{
		"service":               service,
		"zone":                  zone,
		"is_down":               isDown,
		"status_msg":            statusMsg,
		"automated_status_code": health.StatusCode,
		"automated_latency_ms":  health.LatencyMs,
		"user_reports_count":    userReportCount,
		"last_checked_at":       health.CheckedAt,
	})
}
