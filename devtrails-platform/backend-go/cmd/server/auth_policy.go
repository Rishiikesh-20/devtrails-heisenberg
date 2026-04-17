package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	policyStatusPending   = "pending"
	policyStatusWaiting   = "waiting"
	policyStatusActive    = "active"
	policyStatusPaused    = "paused"
	policyStatusCancelled = "cancelled"
	policyStatusExpired   = "expired"

	userRoleWorker = "worker"
	userRoleAdmin  = "admin"

	defaultSignupZone       = "south_delhi"
	defaultSignupShiftStart = "09:00"
	defaultSignupShiftEnd   = "17:00"

	firstActivationWaitingDuration = 48 * time.Hour
	weeklyPolicyCycleDuration      = 7 * 24 * time.Hour
)

type SignupRequest struct {
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Phone     string `json:"phone"`
	Password  string `json:"password" binding:"required,min=6"`
}

type policyActionRequest struct {
	UserID           string `json:"user_id" binding:"required"`
	AutoRenewEnabled *bool  `json:"auto_renew_enabled,omitempty"`
	TargetTier       *int   `json:"target_tier,omitempty"`
}

type policyWaitingPeriodResponse struct {
	Applies bool   `json:"applies"`
	Reason  string `json:"reason,omitempty"`
	EndsAt  string `json:"endsAt,omitempty"`
}

type policyCapsResponse struct {
	MaxPayout           float64 `json:"maxPayout"`
	RemainingCoverage   float64 `json:"remainingCoverage"`
	ClaimsPaidThisCycle int     `json:"claimsPaidThisCycle"`
}

type policySnapshotResponse struct {
	PolicyNumber     string                      `json:"policyNumber"`
	PlanName         string                      `json:"planName"`
	ZoneLabel        string                      `json:"zoneLabel"`
	Status           string                      `json:"status"`
	WeeklyPremium    float64                     `json:"weeklyPremium"`
	CycleStart       string                      `json:"cycleStart"`
	CycleEnd         string                      `json:"cycleEnd"`
	NextRenewalDate  string                      `json:"nextRenewalDate"`
	AutoRenewEnabled bool                        `json:"autoRenewEnabled"`
	WaitingPeriod    policyWaitingPeriodResponse `json:"waitingPeriod"`
	Caps             policyCapsResponse          `json:"caps"`
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func normalizeUserRole(role string) string {
	normalized := strings.ToLower(strings.TrimSpace(role))
	switch normalized {
	case userRoleAdmin:
		return userRoleAdmin
	default:
		return userRoleWorker
	}
}

func resolveRoleForEmail(currentRole string, email string) string {
	if normalizeUserRole(currentRole) == userRoleAdmin {
		return userRoleAdmin
	}

	adminEmail := normalizeEmail(env("ADMIN_EMAIL", ""))
	if adminEmail != "" && normalizeEmail(email) == adminEmail {
		return userRoleAdmin
	}

	return userRoleWorker
}

func isAdminRole(role string) bool {
	return normalizeUserRole(role) == userRoleAdmin
}

func normalizeZone(zone string) string {
	normalized := strings.ToLower(strings.TrimSpace(zone))
	normalized = strings.ReplaceAll(normalized, " ", "_")
	normalized = strings.ReplaceAll(normalized, "-", "_")
	if normalized == "" {
		return defaultSignupZone
	}
	return normalized
}

func composeFullName(firstName, lastName string) string {
	joined := strings.TrimSpace(strings.TrimSpace(firstName) + " " + strings.TrimSpace(lastName))
	if joined == "" {
		return "Delivery Partner"
	}
	return joined
}

func generatePolicyNumber() string {
	prefix := strings.ToUpper(strings.ReplaceAll(uuid.NewString(), "-", ""))
	if len(prefix) > 12 {
		prefix = prefix[:12]
	}
	return fmt.Sprintf("WLK-%s", prefix)
}

func tierFallbackPremium(tier int) float64 {
	switch tier {
	case 1:
		return 79
	case 2:
		return 129
	default:
		return 179
	}
}

func maxCoverageForTier(tier int) float64 {
	switch tier {
	case 1:
		return 900
	case 2:
		return 1600
	default:
		return 2500
	}
}

func planNameForTier(tier int) string {
	switch tier {
	case 1:
		return "Tier 1 - Standard"
	case 2:
		return "Tier 2 - Elevated"
	default:
		return "Tier 3 - High Risk"
	}
}

func humanizeZoneLabel(zone string) string {
	normalized := strings.TrimSpace(strings.ReplaceAll(strings.ReplaceAll(zone, "_", " "), "-", " "))
	if normalized == "" {
		return "Unknown Zone"
	}
	parts := strings.Fields(normalized)
	for idx, part := range parts {
		if len(part) == 0 {
			continue
		}
		parts[idx] = strings.ToUpper(part[:1]) + part[1:]
	}
	return strings.Join(parts, " ")
}

func normalizePolicyStatus(status string) string {
	normalized := strings.ToLower(strings.TrimSpace(status))
	switch normalized {
	case policyStatusActive, policyStatusWaiting, policyStatusPaused, policyStatusCancelled, policyStatusExpired, policyStatusPending:
		return normalized
	default:
		return policyStatusPending
	}
}

func ensurePolicyDefaults(user *User) {
	if user == nil {
		return
	}

	user.Role = normalizeUserRole(user.Role)

	if strings.TrimSpace(user.PolicyNumber) == "" {
		user.PolicyNumber = generatePolicyNumber()
	}

	user.PolicyStatus = normalizePolicyStatus(user.PolicyStatus)
	if user.PolicyStatus == "" {
		user.PolicyStatus = policyStatusPending
	}

	if strings.TrimSpace(user.Zone) == "" {
		user.Zone = defaultSignupZone
	}

	if strings.TrimSpace(user.ShiftStart) == "" {
		user.ShiftStart = defaultSignupShiftStart
	}

	if strings.TrimSpace(user.ShiftEnd) == "" {
		user.ShiftEnd = defaultSignupShiftEnd
	}

	if strings.TrimSpace(user.ShiftStatus) == "" {
		user.ShiftStatus = "inactive"
	}

	if user.RiskTier <= 0 {
		user.RiskTier = 3
	}

	if user.WeeklyPremium <= 0 {
		user.WeeklyPremium = tierFallbackPremium(user.RiskTier)
	}
}

func (a *App) refreshPolicyLifecycle(ctx context.Context, user *User) error {
	if user == nil {
		return nil
	}

	changed := false
	if strings.TrimSpace(user.PolicyNumber) == "" || strings.TrimSpace(user.PolicyStatus) == "" || strings.TrimSpace(user.Zone) == "" || strings.TrimSpace(user.ShiftStart) == "" || strings.TrimSpace(user.ShiftEnd) == "" || strings.TrimSpace(user.ShiftStatus) == "" || user.RiskTier <= 0 || user.WeeklyPremium <= 0 {
		ensurePolicyDefaults(user)
		changed = true
	}

	now := time.Now().UTC()
	status := normalizePolicyStatus(user.PolicyStatus)

	if status == policyStatusWaiting && user.PolicyWaitingUntil != nil && !user.PolicyWaitingUntil.After(now) {
		user.PolicyStatus = policyStatusActive
		user.PolicyWaitingUntil = nil
		if user.PolicyCycleStartAt == nil {
			start := now
			end := start.Add(weeklyPolicyCycleDuration)
			user.PolicyCycleStartAt = &start
			user.PolicyCycleEndAt = &end
			user.PolicyNextRenewalAt = &end
		}
		changed = true
	}

	if status == policyStatusPending && user.PolicyActivatedAt != nil {
		if user.PolicyWaitingUntil != nil && user.PolicyWaitingUntil.After(now) {
			user.PolicyStatus = policyStatusWaiting
		} else {
			user.PolicyStatus = policyStatusActive
			user.PolicyWaitingUntil = nil
		}
		changed = true
	}

	if changed {
		if err := a.db.WithContext(ctx).Save(user).Error; err != nil {
			return err
		}
	}

	return nil
}

func (a *App) findUserByID(ctx context.Context, userID string) (*User, error) {
	id := strings.TrimSpace(userID)
	if id == "" {
		return nil, fmt.Errorf("missing required query parameter: user_id")
	}

	var user User
	err := a.db.WithContext(ctx).Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (a *App) requireAdminUser(c *gin.Context) (*User, bool) {
	userID := strings.TrimSpace(c.Query("user_id"))
	if userID == "" {
		userID = strings.TrimSpace(c.GetHeader("X-User-ID"))
	}

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "admin authentication required"})
		return nil, false
	}

	user, err := a.findUserByID(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "admin authentication failed"})
			return nil, false
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to authorize admin", "details": err.Error()})
		return nil, false
	}

	if !isAdminRole(user.Role) {
		c.JSON(http.StatusForbidden, gin.H{"error": "admin access required"})
		return nil, false
	}

	return user, true
}

func (a *App) signupUser(c *gin.Context) {
	var req SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	email := normalizeEmail(req.Email)
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email is required"})
		return
	}

	password := strings.TrimSpace(req.Password)
	if len(password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password must be at least 6 characters"})
		return
	}

	hashBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to secure password"})
		return
	}

	tier, premium, tierErr := a.fetchTierFromPython(c.Request.Context(), defaultSignupZone, defaultSignupShiftStart, defaultSignupShiftEnd)
	if tierErr != nil {
		tier = 3
		premium = tierFallbackPremium(tier)
	}

	fullName := composeFullName(req.FirstName, req.LastName)
	phone := strings.TrimSpace(req.Phone)

	var existing User
	err = a.db.WithContext(c.Request.Context()).
		Where("LOWER(email) = ?", email).
		First(&existing).Error
	if err == nil {
		if strings.TrimSpace(existing.PasswordHash) != "" {
			c.JSON(http.StatusConflict, gin.H{"error": "account already exists, please log in"})
			return
		}

		existing.FullName = fullName
		existing.Phone = phone
		existing.PasswordHash = string(hashBytes)
		existing.Zone = normalizeZone(existing.Zone)
		existing.ShiftStart = defaultSignupShiftStart
		existing.ShiftEnd = defaultSignupShiftEnd
		existing.ShiftStatus = "inactive"
		existing.Active = false
		existing.Role = resolveRoleForEmail(existing.Role, existing.Email)
		existing.RiskTier = tier
		existing.WeeklyPremium = premium
		ensurePolicyDefaults(&existing)

		if saveErr := a.db.WithContext(c.Request.Context()).Save(&existing).Error; saveErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update signup account", "details": saveErr.Error()})
			return
		}

		if refreshErr := a.refreshPolicyLifecycle(c.Request.Context(), &existing); refreshErr != nil {
			// Continue with response to avoid blocking signup on non-critical refresh issues.
		}

		c.JSON(http.StatusOK, gin.H{
			"message":             "signup successful",
			"onboarding_required": true,
			"user":                buildAuthPayload(existing),
		})
		return
	}

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check existing account", "details": err.Error()})
		return
	}

	user := User{
		ID:               uuid.NewString(),
		Email:            email,
		FullName:         fullName,
		Phone:            phone,
		Zone:             defaultSignupZone,
		ShiftStart:       defaultSignupShiftStart,
		ShiftEnd:         defaultSignupShiftEnd,
		ShiftStatus:      "inactive",
		Active:           false,
		Role:             resolveRoleForEmail("", email),
		RiskTier:         tier,
		WeeklyPremium:    premium,
		WagePerHour:      defaultWagePerHour,
		PasswordHash:     string(hashBytes),
		PolicyNumber:     generatePolicyNumber(),
		PolicyStatus:     policyStatusPending,
		AutoRenewEnabled: true,
	}
	ensurePolicyDefaults(&user)

	if err := a.db.WithContext(c.Request.Context()).Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create signup account", "details": err.Error()})
		return
	}

	if err := a.refreshPolicyLifecycle(c.Request.Context(), &user); err != nil {
		// Continue with response to avoid blocking signup on non-critical refresh issues.
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":             "signup successful",
		"onboarding_required": true,
		"user":                buildAuthPayload(user),
	})
}

func (a *App) getProfile(c *gin.Context) {
	userID, err := readUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := a.findUserByID(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load profile", "details": err.Error()})
		return
	}

	if err := a.refreshPolicyLifecycle(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to refresh profile state", "details": err.Error()})
		return
	}

	payload := buildAuthPayload(*user)
	payload["onboarding_completed"] = strings.TrimSpace(user.FullName) != "" && strings.TrimSpace(user.Zone) != "" && strings.TrimSpace(user.ShiftStart) != "" && strings.TrimSpace(user.ShiftEnd) != ""
	c.JSON(http.StatusOK, payload)
}

func (a *App) getPolicySnapshot(c *gin.Context) {
	userID, err := readUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := a.findUserByID(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load policy", "details": err.Error()})
		return
	}

	if err := a.refreshPolicyLifecycle(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to refresh policy state", "details": err.Error()})
		return
	}

	snapshot, err := a.buildPolicySnapshot(c.Request.Context(), *user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to build policy snapshot", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, snapshot)
}

func (a *App) activatePolicy(c *gin.Context) {
	a.handlePolicyAction(c, "activate")
}

func (a *App) renewPolicy(c *gin.Context) {
	a.handlePolicyAction(c, "renew")
}

func (a *App) pausePolicy(c *gin.Context) {
	a.handlePolicyAction(c, "pause")
}

func (a *App) cancelPolicy(c *gin.Context) {
	a.handlePolicyAction(c, "cancel")
}

func (a *App) handlePolicyAction(c *gin.Context, action string) {
	var req policyActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := a.findUserByID(c.Request.Context(), req.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load user", "details": err.Error()})
		return
	}

	ensurePolicyDefaults(user)
	now := time.Now().UTC()
	status := normalizePolicyStatus(user.PolicyStatus)
	message := "policy updated"

	if req.TargetTier != nil {
		if *req.TargetTier < 1 || *req.TargetTier > 3 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "target_tier must be between 1 and 3"})
			return
		}

		if action == "activate" || action == "renew" {
			user.RiskTier = *req.TargetTier
			user.WeeklyPremium = tierFallbackPremium(*req.TargetTier)
		}
	}

	switch action {
	case "activate":
		if user.PolicyActivatedAt == nil {
			activatedAt := now
			waitingUntil := now.Add(firstActivationWaitingDuration)
			cycleStart := waitingUntil
			cycleEnd := cycleStart.Add(weeklyPolicyCycleDuration)
			user.PolicyActivatedAt = &activatedAt
			user.PolicyWaitingUntil = &waitingUntil
			user.PolicyCycleStartAt = &cycleStart
			user.PolicyCycleEndAt = &cycleEnd
			user.PolicyNextRenewalAt = &cycleEnd
			user.PolicyStatus = policyStatusWaiting
			message = "policy activated with waiting period"
		} else {
			cycleStart := now
			cycleEnd := cycleStart.Add(weeklyPolicyCycleDuration)
			user.PolicyWaitingUntil = nil
			user.PolicyCycleStartAt = &cycleStart
			user.PolicyCycleEndAt = &cycleEnd
			user.PolicyNextRenewalAt = &cycleEnd
			user.PolicyStatus = policyStatusActive
			message = "policy activated"
		}

		if req.AutoRenewEnabled != nil {
			user.AutoRenewEnabled = *req.AutoRenewEnabled
		} else {
			user.AutoRenewEnabled = true
		}
		user.Active = true
		if strings.TrimSpace(user.ShiftStatus) == "" || strings.EqualFold(strings.TrimSpace(user.ShiftStatus), "inactive") {
			user.ShiftStatus = "active"
		}
		user.PolicyCancelledAt = nil
		user.PolicyPausedAt = nil
	case "renew":
		if status == policyStatusCancelled {
			c.JSON(http.StatusConflict, gin.H{"error": "cancelled policy cannot be renewed directly"})
			return
		}

		if user.PolicyActivatedAt == nil {
			activatedAt := now
			user.PolicyActivatedAt = &activatedAt
		}
		cycleStart := now
		cycleEnd := cycleStart.Add(weeklyPolicyCycleDuration)
		user.PolicyWaitingUntil = nil
		user.PolicyCycleStartAt = &cycleStart
		user.PolicyCycleEndAt = &cycleEnd
		user.PolicyNextRenewalAt = &cycleEnd
		user.PolicyStatus = policyStatusActive
		user.AutoRenewEnabled = true
		user.PolicyPausedAt = nil
		message = "policy renewed"
	case "pause":
		if status == policyStatusCancelled {
			c.JSON(http.StatusConflict, gin.H{"error": "cancelled policy cannot be paused"})
			return
		}
		pausedAt := now
		user.PolicyPausedAt = &pausedAt
		user.PolicyStatus = policyStatusPaused
		user.AutoRenewEnabled = false
		message = "policy paused"
	case "cancel":
		cancelledAt := now
		user.PolicyCancelledAt = &cancelledAt
		user.PolicyStatus = policyStatusCancelled
		user.AutoRenewEnabled = false
		user.PolicyWaitingUntil = nil
		message = "policy cancelled"
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "unknown policy action"})
		return
	}

	if err := a.db.WithContext(c.Request.Context()).Save(user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to persist policy action", "details": err.Error()})
		return
	}

	if err := a.refreshPolicyLifecycle(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to refresh policy", "details": err.Error()})
		return
	}

	snapshot, err := a.buildPolicySnapshot(c.Request.Context(), *user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to build policy snapshot", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": message,
		"user":    buildAuthPayload(*user),
		"policy":  snapshot,
	})
}

func (a *App) buildPolicySnapshot(ctx context.Context, user User) (policySnapshotResponse, error) {
	now := time.Now().UTC()
	status := normalizePolicyStatus(user.PolicyStatus)

	cycleStart := now
	if user.PolicyCycleStartAt != nil {
		cycleStart = user.PolicyCycleStartAt.UTC()
	}
	cycleEnd := cycleStart.Add(weeklyPolicyCycleDuration)
	if user.PolicyCycleEndAt != nil {
		cycleEnd = user.PolicyCycleEndAt.UTC()
	}
	nextRenewal := cycleEnd
	if user.PolicyNextRenewalAt != nil {
		nextRenewal = user.PolicyNextRenewalAt.UTC()
	}

	maxPayout := maxCoverageForTier(user.RiskTier)
	used, claimsPaidThisCycle, err := a.computePolicyUsage(ctx, user.ID, cycleStart, cycleEnd)
	if err != nil {
		return policySnapshotResponse{}, err
	}
	remainingCoverage := maxPayout - used
	if remainingCoverage < 0 {
		remainingCoverage = 0
	}

	waitingPeriod := policyWaitingPeriodResponse{}
	if status == policyStatusWaiting && user.PolicyWaitingUntil != nil && user.PolicyWaitingUntil.After(now) {
		waitingPeriod.Applies = true
		waitingPeriod.Reason = "Initial activation waiting period applies for 48 hours."
		waitingPeriod.EndsAt = user.PolicyWaitingUntil.UTC().Format(time.RFC3339)
	}

	return policySnapshotResponse{
		PolicyNumber:     user.PolicyNumber,
		PlanName:         planNameForTier(user.RiskTier),
		ZoneLabel:        humanizeZoneLabel(user.Zone),
		Status:           status,
		WeeklyPremium:    user.WeeklyPremium,
		CycleStart:       cycleStart.Format(time.RFC3339),
		CycleEnd:         cycleEnd.Format(time.RFC3339),
		NextRenewalDate:  nextRenewal.Format(time.RFC3339),
		AutoRenewEnabled: user.AutoRenewEnabled,
		WaitingPeriod:    waitingPeriod,
		Caps: policyCapsResponse{
			MaxPayout:           maxPayout,
			RemainingCoverage:   roundCurrency(remainingCoverage),
			ClaimsPaidThisCycle: claimsPaidThisCycle,
		},
	}, nil
}

func (a *App) computePolicyUsage(ctx context.Context, userID string, cycleStart, cycleEnd time.Time) (float64, int, error) {
	used := 0.0
	claimsCount := 0

	hasPayouts, err := a.tableExists(ctx, "public.payout_transactions")
	if err != nil {
		return 0, 0, err
	}
	if hasPayouts {
		if err := a.db.WithContext(ctx).Raw(
			`SELECT COALESCE(SUM(amount), 0)
			 FROM payout_transactions
			 WHERE user_id = ?
			   AND LOWER(status::text) IN ('credited', 'succeeded')
			   AND created_at >= ?
			   AND created_at <= ?`,
			userID,
			cycleStart,
			cycleEnd,
		).Scan(&used).Error; err != nil {
			return 0, 0, err
		}
	}

	hasClaims, err := a.tableExists(ctx, "public.claims")
	if err != nil {
		return 0, 0, err
	}
	if hasClaims {
		var count int64
		if err := a.db.WithContext(ctx).Raw(
			`SELECT COUNT(*)
			 FROM claims
			 WHERE user_id = ?
			   AND LOWER(status::text) IN ('approved', 'paid')
			   AND COALESCE(created_at, submitted_at, NOW()) >= ?
			   AND COALESCE(created_at, submitted_at, NOW()) <= ?`,
			userID,
			cycleStart,
			cycleEnd,
		).Scan(&count).Error; err != nil {
			return 0, 0, err
		}
		claimsCount = int(count)
	}

	return roundCurrency(used), claimsCount, nil
}

func (a *App) tableExists(ctx context.Context, tableName string) (bool, error) {
	var exists bool
	if err := a.db.WithContext(ctx).Raw("SELECT to_regclass(?) IS NOT NULL", tableName).Scan(&exists).Error; err != nil {
		return false, err
	}
	return exists, nil
}
