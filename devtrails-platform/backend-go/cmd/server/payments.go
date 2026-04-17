package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	defaultWagePerHour           = 150.0
	maxShiftHoursPerEvent        = 8.0
	defaultLostHoursPerEvent     = 4.0
	coPayMultiplier              = 0.80
	minimumInstantTransferAmount = 20.0
	maxStripeErrorBodyBytes      = 8 * 1024
	payoutStatusPending          = "pending"
	payoutStatusProcessing       = "processing"
	payoutStatusSucceeded        = "succeeded"
	payoutStatusFailed           = "failed"
	payoutStatusCredited         = "credited"
	ledgerEntryTypeCredit        = "credit"
	ledgerEntrySourceStripe      = "stripe"
	ledgerEntrySourceSimulation  = "simulated_rail"
	stripeStatusSimulated        = "simulated"
	defaultPayoutCurrencyLower   = "inr"
)

type Event struct {
	ID             string
	Type           string
	SeverityFactor float64
	Timestamp      int64
	LostHours      float64
}

type Ledger struct {
	UserID    string    `gorm:"column:user_id;type:text;primaryKey"`
	Balance   float64   `gorm:"column:balance;type:numeric(14,2);not null;default:0"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime"`
}

func (Ledger) TableName() string {
	return "ledgers"
}

type PayoutTransaction struct {
	ID                    string     `gorm:"column:id;type:text;primaryKey"`
	UserID                string     `gorm:"column:user_id;type:text;not null;index"`
	EventID               string     `gorm:"column:event_id;type:text;not null;index"`
	ClaimID               string     `gorm:"column:claim_id;type:text;not null"`
	Amount                float64    `gorm:"column:amount;type:numeric(14,2);not null"`
	Currency              string     `gorm:"column:currency;type:text;not null;default:'inr'"`
	StripePaymentIntentID string     `gorm:"column:stripe_payment_intent_id;type:text;index"`
	StripeStatus          string     `gorm:"column:stripe_status;type:text;not null"`
	Status                string     `gorm:"column:status;type:text;not null;index"`
	ErrorMessage          string     `gorm:"column:error_message;type:text"`
	IdempotencyKey        string     `gorm:"column:idempotency_key;type:text;not null;uniqueIndex"`
	ProcessedAt           *time.Time `gorm:"column:processed_at"`
	CreatedAt             time.Time  `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt             time.Time  `gorm:"column:updated_at;autoUpdateTime"`
}

func (PayoutTransaction) TableName() string {
	return "payout_transactions"
}

type LedgerEntry struct {
	ID                  string    `gorm:"column:id;type:text;primaryKey"`
	PayoutTransactionID string    `gorm:"column:payout_transaction_id;type:text;not null;uniqueIndex"`
	UserID              string    `gorm:"column:user_id;type:text;not null;index"`
	EventID             string    `gorm:"column:event_id;type:text;not null;index"`
	Amount              float64   `gorm:"column:amount;type:numeric(14,2);not null"`
	EntryType           string    `gorm:"column:entry_type;type:text;not null"`
	Source              string    `gorm:"column:source;type:text;not null"`
	CreatedAt           time.Time `gorm:"column:created_at;autoCreateTime"`
}

func (LedgerEntry) TableName() string {
	return "ledger_entries"
}

type stripePaymentIntentResponse struct {
	ID               string                  `json:"id"`
	Status           string                  `json:"status"`
	LastPaymentError *stripeLastPaymentError `json:"last_payment_error"`
}

type stripeLastPaymentError struct {
	Message string `json:"message"`
}

func CalculatePayout(user User, event Event) (float64, error) {
	if user.WagePerHour < 0 {
		return 0, fmt.Errorf("wage_per_hour must be non-negative: %.2f", user.WagePerHour)
	}

	if event.SeverityFactor < 0 {
		return 0, fmt.Errorf("severity_factor must be non-negative: %.2f", event.SeverityFactor)
	}

	lostHours := event.LostHours
	if lostHours <= 0 {
		lostHours = estimateLostHoursForShift(user.ShiftStart, user.ShiftEnd)
	}
	if lostHours < 0 {
		return 0, errors.New("lost_hours cannot be negative")
	}

	grossPayout := lostHours * user.WagePerHour * event.SeverityFactor
	if grossPayout < 0 {
		return 0, errors.New("computed gross payout cannot be negative")
	}

	return roundCurrency(grossPayout), nil
}

func estimateLostHoursForShift(shiftStart string, shiftEnd string) float64 {
	start, startErr := time.Parse("15:04", strings.TrimSpace(shiftStart))
	end, endErr := time.Parse("15:04", strings.TrimSpace(shiftEnd))
	if startErr != nil || endErr != nil {
		return defaultLostHoursPerEvent
	}

	duration := end.Sub(start)
	if duration <= 0 {
		duration += 24 * time.Hour
	}

	hours := duration.Hours()
	if hours <= 0 {
		return defaultLostHoursPerEvent
	}
	if hours > maxShiftHoursPerEvent {
		hours = maxShiftHoursPerEvent
	}

	return roundCurrency(hours)
}

func dailyCapForTier(tier int) float64 {
	switch tier {
	case 1:
		return 420
	case 2:
		return 700
	default:
		return 1000
	}
}

func resolvePolicyCycleWindow(user User, eventAt time.Time) (time.Time, time.Time) {
	if user.PolicyCycleStartAt != nil && user.PolicyCycleEndAt != nil {
		return user.PolicyCycleStartAt.UTC(), user.PolicyCycleEndAt.UTC()
	}

	cycleEnd := eventAt.UTC()
	cycleStart := cycleEnd.Add(-weeklyPolicyCycleDuration)
	return cycleStart, cycleEnd
}

func (a *App) sumCommittedPayouts(ctx context.Context, userID string, from time.Time, to time.Time) (float64, error) {
	hasPayouts, err := a.tableExists(ctx, "public.payout_transactions")
	if err != nil {
		return 0, err
	}
	if !hasPayouts {
		return 0, nil
	}

	used := 0.0
	if err := a.db.WithContext(ctx).Raw(
		`SELECT COALESCE(SUM(amount), 0)
		 FROM payout_transactions
		 WHERE user_id = ?
		   AND LOWER(status::text) IN ('pending', 'processing', 'succeeded', 'credited')
		   AND created_at >= ?
		   AND created_at < ?`,
		userID,
		from.UTC(),
		to.UTC(),
	).Scan(&used).Error; err != nil {
		return 0, err
	}

	return roundCurrency(used), nil
}

func (a *App) applyPayoutRules(ctx context.Context, user User, grossAmount float64, eventTimestamp int64) (float64, error) {
	if grossAmount <= 0 {
		return 0, nil
	}

	eventAt := time.Now().UTC()
	if eventTimestamp > 0 {
		eventAt = time.Unix(eventTimestamp, 0).UTC()
	}

	coPayAdjusted := roundCurrency(grossAmount * coPayMultiplier)
	weeklyCap := maxCoverageForTier(user.RiskTier)
	dailyCap := dailyCapForTier(user.RiskTier)

	cycleStart, cycleEnd := resolvePolicyCycleWindow(user, eventAt)
	usedWeekly, err := a.sumCommittedPayouts(ctx, user.ID, cycleStart, cycleEnd)
	if err != nil {
		return 0, fmt.Errorf("compute weekly usage: %w", err)
	}
	remainingWeekly := weeklyCap - usedWeekly
	if remainingWeekly < 0 {
		remainingWeekly = 0
	}

	dayStart := time.Date(eventAt.Year(), eventAt.Month(), eventAt.Day(), 0, 0, 0, 0, time.UTC)
	dayEnd := dayStart.Add(24 * time.Hour)
	usedDaily, err := a.sumCommittedPayouts(ctx, user.ID, dayStart, dayEnd)
	if err != nil {
		return 0, fmt.Errorf("compute daily usage: %w", err)
	}
	remainingDaily := dailyCap - usedDaily
	if remainingDaily < 0 {
		remainingDaily = 0
	}

	finalPayout := math.Min(coPayAdjusted, remainingDaily)
	finalPayout = math.Min(finalPayout, remainingWeekly)
	if finalPayout < 0 {
		finalPayout = 0
	}

	return roundCurrency(finalPayout), nil
}

func roundCurrency(v float64) float64 {
	return math.Round(v*100) / 100
}

func (a *App) ProcessPayout(ctx context.Context, user User, event Event, decision FRSResult) (float64, error) {
	if normalizeDecision(decision.Decision) != "auto_approve" {
		return 0, fmt.Errorf("claim decision is not auto_approve for worker_id=%s", decision.WorkerID)
	}

	if user.ID == "" {
		return 0, errors.New("missing user id for payout")
	}

	if strings.TrimSpace(event.ID) == "" {
		return 0, errors.New("missing event id for payout")
	}

	grossAmount, err := CalculatePayout(user, event)
	if err != nil {
		return 0, err
	}
	if grossAmount <= 0 {
		return 0, fmt.Errorf("calculated gross payout must be greater than zero for user=%s", user.ID)
	}

	amount, err := a.applyPayoutRules(ctx, user, grossAmount, event.Timestamp)
	if err != nil {
		return 0, err
	}
	if amount <= 0 {
		return 0, fmt.Errorf("calculated payout must be greater than zero for user=%s", user.ID)
	}

	currency := strings.ToLower(strings.TrimSpace(a.cfg.StripeCurrency))
	if currency == "" {
		currency = defaultPayoutCurrencyLower
	}

	idempotencyKey := fmt.Sprintf("%s:%s", event.ID, user.ID)

	var existing PayoutTransaction
	existingErr := a.db.WithContext(ctx).
		Where("idempotency_key = ?", idempotencyKey).
		First(&existing).Error
	if existingErr == nil {
		switch existing.Status {
		case payoutStatusCredited, payoutStatusSucceeded, payoutStatusProcessing:
			return existing.Amount, nil
		default:
			return 0, fmt.Errorf("payout already exists with status=%s user=%s event=%s", existing.Status, user.ID, event.ID)
		}
	}
	if existingErr != nil && !errors.Is(existingErr, gorm.ErrRecordNotFound) {
		return 0, fmt.Errorf("lookup payout transaction: %w", existingErr)
	}

	now := time.Now().UTC()
	claimID := strings.TrimSpace(decision.ClaimID)
	if claimID == "" {
		claimID = uuid.NewString()
	}

	payoutTx := PayoutTransaction{
		ID:             uuid.NewString(),
		UserID:         user.ID,
		EventID:        event.ID,
		ClaimID:        claimID,
		Amount:         amount,
		Currency:       currency,
		StripeStatus:   "created",
		Status:         payoutStatusPending,
		IdempotencyKey: idempotencyKey,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := a.db.WithContext(ctx).Create(&payoutTx).Error; err != nil {
		return 0, fmt.Errorf("create payout transaction: %w", err)
	}

	if strings.TrimSpace(a.cfg.StripeSecretKey) == "" || amount < minimumInstantTransferAmount {
		if err := a.completeSimulatedPayout(ctx, payoutTx, event); err != nil {
			return 0, err
		}
		return amount, nil
	}

	intent, stripeErr := a.createStripePaymentIntent(ctx, payoutTx, decision)
	if stripeErr != nil {
		_ = a.db.WithContext(ctx).
			Model(&PayoutTransaction{}).
			Where("id = ?", payoutTx.ID).
			Updates(map[string]any{
				"status":        payoutStatusFailed,
				"stripe_status": payoutStatusFailed,
				"error_message": stripeErr.Error(),
				"updated_at":    time.Now().UTC(),
			}).Error
		return 0, stripeErr
	}

	internalStatus := mapStripeStatusToInternal(intent.Status)
	updatePayload := map[string]any{
		"stripe_payment_intent_id": intent.ID,
		"stripe_status":            intent.Status,
		"status":                   internalStatus,
		"updated_at":               time.Now().UTC(),
	}
	if internalStatus == payoutStatusFailed && intent.LastPaymentError != nil {
		updatePayload["error_message"] = intent.LastPaymentError.Message
	}
	if err := a.db.WithContext(ctx).
		Model(&PayoutTransaction{}).
		Where("id = ?", payoutTx.ID).
		Updates(updatePayload).Error; err != nil {
		return 0, fmt.Errorf("update payout transaction: %w", err)
	}

	if internalStatus != payoutStatusSucceeded {
		return amount, nil
	}

	if err := a.applyLedgerCredit(ctx, payoutTx, event, ledgerEntrySourceStripe); err != nil {
		return 0, err
	}

	processedAt := time.Now().UTC()
	if err := a.db.WithContext(ctx).
		Model(&PayoutTransaction{}).
		Where("id = ?", payoutTx.ID).
		Updates(map[string]any{
			"status":       payoutStatusCredited,
			"processed_at": processedAt,
			"updated_at":   processedAt,
		}).Error; err != nil {
		return 0, fmt.Errorf("finalize payout transaction: %w", err)
	}

	return amount, nil
}

func (a *App) completeSimulatedPayout(ctx context.Context, payoutTx PayoutTransaction, event Event) error {
	if err := a.applyLedgerCredit(ctx, payoutTx, event, ledgerEntrySourceSimulation); err != nil {
		return err
	}

	processedAt := time.Now().UTC()
	if err := a.db.WithContext(ctx).
		Model(&PayoutTransaction{}).
		Where("id = ?", payoutTx.ID).
		Updates(map[string]any{
			"status":        payoutStatusCredited,
			"stripe_status": stripeStatusSimulated,
			"processed_at":  processedAt,
			"updated_at":    processedAt,
		}).Error; err != nil {
		return fmt.Errorf("finalize simulated payout transaction: %w", err)
	}

	return nil
}

func (a *App) createStripePaymentIntent(ctx context.Context, payoutTx PayoutTransaction, decision FRSResult) (*stripePaymentIntentResponse, error) {
	secretKey := strings.TrimSpace(a.cfg.StripeSecretKey)
	if secretKey == "" {
		return nil, errors.New("STRIPE_SECRET_KEY is not configured")
	}

	paymentMethod := strings.TrimSpace(a.cfg.StripePaymentMethod)
	if paymentMethod == "" {
		return nil, errors.New("STRIPE_PAYMENT_METHOD is not configured")
	}

	amountMinor := int64(math.Round(payoutTx.Amount * 100))
	if amountMinor <= 0 {
		return nil, fmt.Errorf("stripe amount must be positive, got %.2f", payoutTx.Amount)
	}

	form := url.Values{}
	form.Set("amount", strconv.FormatInt(amountMinor, 10))
	form.Set("currency", payoutTx.Currency)
	form.Set("confirm", "true")
	form.Set("payment_method", paymentMethod)
	form.Add("payment_method_types[]", "card")
	form.Set("description", fmt.Sprintf("DevTrails payout event=%s user=%s", payoutTx.EventID, payoutTx.UserID))
	form.Set("metadata[user_id]", payoutTx.UserID)
	form.Set("metadata[event_id]", payoutTx.EventID)
	form.Set("metadata[idempotency_key]", payoutTx.IdempotencyKey)
	form.Set("metadata[frs_score]", strconv.Itoa(decision.FRSScore))

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.stripe.com/v1/payment_intents", strings.NewReader(form.Encode()))
	if err != nil {
		return nil, fmt.Errorf("build stripe request: %w", err)
	}
	// Stripe requires secret key in basic auth username and an empty password.
	req.SetBasicAuth(secretKey, "")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Idempotency-Key", payoutTx.IdempotencyKey)

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("send stripe request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, maxStripeErrorBodyBytes))
		return nil, fmt.Errorf("stripe payment intent failed status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var parsed stripePaymentIntentResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, fmt.Errorf("decode stripe response: %w", err)
	}
	if parsed.ID == "" {
		return nil, errors.New("stripe response missing payment intent id")
	}

	return &parsed, nil
}

func (a *App) applyLedgerCredit(ctx context.Context, payoutTx PayoutTransaction, event Event, source string) error {
	if payoutTx.Amount < 0 {
		return fmt.Errorf("ledger credit amount must be non-negative: %.2f", payoutTx.Amount)
	}

	entrySource := strings.TrimSpace(source)
	if entrySource == "" {
		entrySource = ledgerEntrySourceStripe
	}

	now := time.Now().UTC()
	return a.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(
			`INSERT INTO ledgers (user_id, balance, created_at, updated_at)
			 VALUES ($1, 0, $2, $3)
			 ON CONFLICT (user_id) DO NOTHING`,
			payoutTx.UserID,
			now,
			now,
		).Error; err != nil {
			return fmt.Errorf("ensure ledger row: %w", err)
		}

		entry := LedgerEntry{
			ID:                  uuid.NewString(),
			PayoutTransactionID: payoutTx.ID,
			UserID:              payoutTx.UserID,
			EventID:             event.ID,
			Amount:              payoutTx.Amount,
			EntryType:           ledgerEntryTypeCredit,
			Source:              entrySource,
			CreatedAt:           now,
		}

		result := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "payout_transaction_id"}},
			DoNothing: true,
		}).Create(&entry)
		if result.Error != nil {
			return fmt.Errorf("insert ledger entry: %w", result.Error)
		}

		if result.RowsAffected == 0 {
			return nil
		}

		if err := tx.Exec(
			"UPDATE ledgers SET balance = balance + $1, updated_at = $2 WHERE user_id = $3",
			payoutTx.Amount,
			now,
			payoutTx.UserID,
		).Error; err != nil {
			return fmt.Errorf("apply ledger balance update: %w", err)
		}

		return nil
	})
}

func mapStripeStatusToInternal(stripeStatus string) string {
	s := strings.ToLower(strings.TrimSpace(stripeStatus))
	switch s {
	case "succeeded":
		return payoutStatusSucceeded
	case "processing", "requires_action", "requires_capture", "requires_confirmation":
		return payoutStatusProcessing
	case "requires_payment_method", "canceled":
		return payoutStatusFailed
	default:
		return payoutStatusProcessing
	}
}
