package main

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const (
	defaultListOffset = 0
	maxListOffset     = 100000
)

type listPagination struct {
	Limit    int   `json:"limit"`
	Offset   int   `json:"offset"`
	Returned int   `json:"returned"`
	Total    int64 `json:"total"`
	HasMore  bool  `json:"has_more"`
}

type walletEntryItem struct {
	EntryID    string    `json:"entry_id"`
	PayoutID   string    `json:"payout_id,omitempty"`
	EventID    string    `json:"event_id"`
	Amount     float64   `json:"amount"`
	EntryType  string    `json:"entry_type"`
	Source     string    `json:"source"`
	CreatedAt  time.Time `json:"created_at"`
}

type walletV1Response struct {
	WorkerID   string         `json:"worker_id"`
	Currency   string         `json:"currency"`
	Balance    float64        `json:"balance"`
	UpdatedAt  time.Time      `json:"updated_at"`
	AsOf       time.Time      `json:"as_of"`
	Entries    []walletEntryItem `json:"entries"`
	Pagination listPagination `json:"pagination"`
}

type payoutListV1Filters struct {
	Statuses  []string `json:"statuses,omitempty"`
	Decisions []string `json:"decisions,omitempty"`
	EventID   string   `json:"event_id,omitempty"`
	From      string   `json:"from,omitempty"`
	To        string   `json:"to,omitempty"`
}

type payoutListV1Item struct {
	PayoutID      string     `json:"payout_id"`
	ClaimID       string     `json:"claim_id"`
	EventID       string     `json:"event_id"`
	WorkerID      string     `json:"worker_id"`
	Amount        float64    `json:"amount"`
	Currency      string     `json:"currency"`
	Status        string     `json:"status"`
	StatusLabel   string     `json:"status_label"`
	Decision      string     `json:"decision"`
	DecisionLabel string     `json:"decision_label"`
	CreatedAt     time.Time  `json:"created_at"`
	ProcessedAt   *time.Time `json:"processed_at"`
	FailureReason string     `json:"failure_reason,omitempty"`
	ETAMinutes    int        `json:"eta_minutes"`
	NextAction    string     `json:"next_action"`
}

type payoutListV1Response struct {
	WorkerID   string              `json:"worker_id"`
	Currency   string              `json:"currency"`
	AsOf       time.Time           `json:"as_of"`
	Pagination listPagination      `json:"pagination"`
	Filters    payoutListV1Filters `json:"filters"`
	Items      []payoutListV1Item  `json:"items"`
}

type claimListV1Filters struct {
	Statuses  []string `json:"statuses,omitempty"`
	Decisions []string `json:"decisions,omitempty"`
	EventID   string   `json:"event_id,omitempty"`
	From      string   `json:"from,omitempty"`
	To        string   `json:"to,omitempty"`
}

type claimListV1Item struct {
	ClaimID        string    `json:"claim_id"`
	EventID        string    `json:"event_id"`
	WorkerID       string    `json:"worker_id"`
	Status         string    `json:"status"`
	StatusLabel    string    `json:"status_label"`
	Decision       string    `json:"decision"`
	DecisionLabel  string    `json:"decision_label"`
	FRSScore       float64   `json:"frs_score"`
	RiskOutcome    string    `json:"risk_outcome"`
	PayoutID       string    `json:"payout_id,omitempty"`
	PayoutStatus   string    `json:"payout_status,omitempty"`
	PayoutAmount   float64   `json:"payout_amount"`
	CreatedAt      time.Time `json:"created_at"`
}

type claimListV1Response struct {
	WorkerID   string             `json:"worker_id"`
	AsOf       time.Time          `json:"as_of"`
	Pagination listPagination     `json:"pagination"`
	Filters    claimListV1Filters `json:"filters"`
	Items      []claimListV1Item  `json:"items"`
}

type claimDetailTimeline struct {
	SubmittedAt   time.Time  `json:"submitted_at"`
	VerifiedAt    *time.Time `json:"verified_at,omitempty"`
	ApprovedAt    *time.Time `json:"approved_at,omitempty"`
	PaidAt        *time.Time `json:"paid_at,omitempty"`
	LastUpdatedAt time.Time  `json:"last_updated_at"`
}

type claimDetailFraudOutput struct {
	FRSScore         float64  `json:"frs_score"`
	NormalizedScore  float64  `json:"normalized_score"`
	Threshold        float64  `json:"threshold"`
	Outcome          string   `json:"outcome"`
	Decision         string   `json:"decision"`
	RiskFlags        []string `json:"risk_flags"`
	ModelVersion     string   `json:"model_version"`
	EvaluatedAt      time.Time `json:"evaluated_at"`
}

type claimDetailEvidence struct {
	Type      string     `json:"type"`
	Source    string     `json:"source"`
	Title     string     `json:"title"`
	Value     string     `json:"value,omitempty"`
	Timestamp *time.Time `json:"timestamp,omitempty"`
}

type claimDetailResponse struct {
	ClaimID          string                 `json:"claim_id"`
	EventID          string                 `json:"event_id"`
	WorkerID         string                 `json:"worker_id"`
	Zone             string                 `json:"zone"`
	EventType        string                 `json:"event_type"`
	Status           string                 `json:"status"`
	StatusLabel      string                 `json:"status_label"`
	Decision         string                 `json:"decision"`
	DecisionLabel    string                 `json:"decision_label"`
	ClaimAmount      float64                `json:"claim_amount"`
	PayoutAmount     float64                `json:"payout_amount"`
	Currency         string                 `json:"currency"`
	Timeline         claimDetailTimeline    `json:"timeline"`
	DecisionSummary  string                 `json:"decision_summary"`
	DecisionReasons  []string               `json:"decision_reasons"`
	FraudOutput      claimDetailFraudOutput `json:"fraud_output"`
	Evidence         []claimDetailEvidence  `json:"evidence"`
	NextAction       string                 `json:"next_action"`
}

type payoutSupportResponse struct {
	WorkerID      string `json:"worker_id"`
	PayoutID      string `json:"payout_id"`
	Status        string `json:"status"`
	StatusLabel   string `json:"status_label"`
	ETAMinutes    int    `json:"eta_minutes"`
	NextAction    string `json:"next_action"`
	SupportHint   string `json:"support_hint"`
	FailureReason string `json:"failure_reason,omitempty"`
}

type tierUpgradeRequest struct {
	UserID     string `json:"user_id" binding:"required"`
	TargetTier int    `json:"target_tier" binding:"required"`
	Reason     string `json:"reason"`
}

type tierUpgradeResponse struct {
	Message           string `json:"message"`
	OldTier           int    `json:"old_tier"`
	NewTier           int    `json:"new_tier"`
	OldWeeklyPremium  float64 `json:"old_weekly_premium"`
	NewWeeklyPremium  float64 `json:"new_weekly_premium"`
	PremiumDelta      float64 `json:"premium_delta"`
	Reason            string  `json:"reason,omitempty"`
	User              gin.H   `json:"user"`
}

func parseListOffset(c *gin.Context) int {
	offsetRaw := strings.TrimSpace(c.Query("offset"))
	if offsetRaw == "" {
		return defaultListOffset
	}

	parsed, err := strconv.Atoi(offsetRaw)
	if err != nil {
		return defaultListOffset
	}
	if parsed < 0 {
		return defaultListOffset
	}
	if parsed > maxListOffset {
		return maxListOffset
	}
	return parsed
}

func parseCSVFilter(raw string, normalizer func(string) string) []string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil
	}

	parts := strings.Split(trimmed, ",")
	seen := make(map[string]struct{}, len(parts))
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		value := strings.TrimSpace(part)
		if value == "" {
			continue
		}
		if normalizer != nil {
			value = normalizer(value)
		}
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		out = append(out, value)
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

func normalizeReportCategory(raw string) string {
	category := strings.ToLower(strings.TrimSpace(raw))
	category = strings.ReplaceAll(category, "-", "_")
	category = strings.ReplaceAll(category, " ", "_")
	return category
}

func isPlaceholderZone(zone string) bool {
	normalized := strings.ToLower(strings.TrimSpace(zone))
	switch normalized {
	case "", "unknown", "n/a", "na", "none", "null":
		return true
	default:
		return false
	}
}

func (a *App) resolveUserZone(ctx *gin.Context, userID string, zone string) (string, error) {
	normalizedZone := normalizeZone(zone)
	if !isPlaceholderZone(zone) && strings.TrimSpace(normalizedZone) != "" {
		return normalizedZone, nil
	}

	trimmedUserID := strings.TrimSpace(userID)
	if trimmedUserID == "" {
		return "", fmt.Errorf("zone is required")
	}

	var user User
	if err := a.db.WithContext(ctx.Request.Context()).Where("id = ?", trimmedUserID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", fmt.Errorf("zone is required")
		}
		return "", fmt.Errorf("failed to resolve user zone")
	}

	resolved := normalizeZone(user.Zone)
	if strings.TrimSpace(resolved) == "" || isPlaceholderZone(resolved) {
		return "", fmt.Errorf("zone is required")
	}

	return resolved, nil
}

func parseTimeFilter(raw string) (*time.Time, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil, nil
	}

	layouts := []string{time.RFC3339, "2006-01-02"}
	for _, layout := range layouts {
		if parsed, err := time.Parse(layout, trimmed); err == nil {
			utc := parsed.UTC()
			return &utc, nil
		}
	}

	return nil, fmt.Errorf("invalid time format: %s", trimmed)
}

func normalizePayoutStatus(status string) string {
	normalized := strings.ToLower(strings.TrimSpace(status))
	switch normalized {
	case payoutStatusPending, payoutStatusProcessing, payoutStatusSucceeded, payoutStatusFailed, payoutStatusCredited:
		return normalized
	default:
		return normalized
	}
}

func normalizeClaimStatus(status string) string {
	normalized := strings.ToLower(strings.TrimSpace(status))
	switch normalized {
	case "submitted", "under_review", "approved", "rejected", "paid":
		return normalized
	default:
		return normalized
	}
}

func payoutStatusLabel(status string) string {
	switch normalizePayoutStatus(status) {
	case payoutStatusPending:
		return "Pending"
	case payoutStatusProcessing:
		return "Processing"
	case payoutStatusSucceeded:
		return "Succeeded"
	case payoutStatusCredited:
		return "Credited"
	case payoutStatusFailed:
		return "Failed"
	default:
		return strings.Title(strings.ReplaceAll(strings.TrimSpace(status), "_", " "))
	}
}

func claimStatusLabel(status string) string {
	switch normalizeClaimStatus(status) {
	case "submitted":
		return "Submitted"
	case "under_review":
		return "Under Review"
	case "approved":
		return "Approved"
	case "rejected":
		return "Rejected"
	case "paid":
		return "Paid"
	default:
		return strings.Title(strings.ReplaceAll(strings.TrimSpace(status), "_", " "))
	}
}

func decisionLabel(decision string) string {
	switch normalizeDecision(decision) {
	case "auto_approve":
		return "Auto Approved"
	case "partial_hold":
		return "Partial Hold"
	case "full_withhold":
		return "Full Withhold"
	default:
		return strings.Title(strings.ReplaceAll(strings.TrimSpace(decision), "_", " "))
	}
}

func deriveRiskOutcome(decision string, frsScore float64) string {
	normalizedDecision := normalizeDecision(decision)
	if normalizedDecision == "auto_approve" {
		return "pass"
	}
	if frsScore >= 65 {
		return "fail"
	}
	return "review"
}

func payoutSupportHints(status string, failureReason string) (int, string, string) {
	switch normalizePayoutStatus(status) {
	case payoutStatusCredited, payoutStatusSucceeded:
		return 0, "none", "Payout is completed. No action needed."
	case payoutStatusProcessing:
		return 10, "wait_for_processing", "Payout is processing. Check again shortly."
	case payoutStatusPending:
		return 20, "wait_for_processing", "Payout is queued. Monitoring in progress."
	case payoutStatusFailed:
		if strings.TrimSpace(failureReason) == "" {
			return -1, "contact_support", "Payout failed. Contact support with payout ID."
		}
		return -1, "contact_support", "Payout failed. Contact support and include failure reason."
	default:
		return 30, "monitor", "Payout status is being reconciled."
	}
}

func normalizeFraudScore(raw float64) float64 {
	if raw < 0 {
		return 0
	}
	if raw <= 1 {
		return raw
	}
	if raw > 100 {
		return 1
	}
	return raw / 100
}

func inferRiskFlags(decision string, score float64, payoutStatus string) []string {
	flags := make([]string, 0, 3)
	normalized := normalizeFraudScore(score)
	if normalized >= 0.65 {
		flags = append(flags, "high_fraud_score")
	}
	if normalizeDecision(decision) != "auto_approve" {
		flags = append(flags, "manual_review_required")
	}
	if normalizePayoutStatus(payoutStatus) == payoutStatusFailed {
		flags = append(flags, "payout_failed")
	}
	if len(flags) == 0 {
		flags = append(flags, "no_high_risk_flags")
	}
	return flags
}

func decisionSummaryForClaim(decision string, status string, score float64) string {
	normalizedDecision := normalizeDecision(decision)
	normalizedStatus := normalizeClaimStatus(status)
	normalizedScore := normalizeFraudScore(score)

	if normalizedDecision == "auto_approve" && (normalizedStatus == "approved" || normalizedStatus == "paid" || normalizedStatus == "") {
		return "Claim passed automated fraud checks and was approved for payout."
	}
	if normalizedStatus == "under_review" {
		return "Claim is under review due to elevated risk signals and awaits final decision."
	}
	if normalizedStatus == "rejected" || normalizedDecision == "full_withhold" {
		return "Claim was rejected because fraud and consistency checks exceeded allowed thresholds."
	}
	if normalizedScore >= 0.65 {
		return "Claim encountered elevated fraud indicators and requires additional verification."
	}
	return "Claim has been recorded and is moving through verification checks."
}

func decisionReasonsForClaim(decision string, status string, score float64, payoutStatus string) []string {
	reasons := make([]string, 0, 4)
	normalizedScore := normalizeFraudScore(score)
	decisionNormalized := normalizeDecision(decision)
	statusNormalized := normalizeClaimStatus(status)

	reasons = append(reasons, fmt.Sprintf("Fraud risk score evaluated at %.0f/100.", normalizedScore*100))

	switch decisionNormalized {
	case "auto_approve":
		reasons = append(reasons, "Decision engine marked this claim as auto-approvable.")
	case "partial_hold":
		reasons = append(reasons, "Decision engine requested partial hold pending checks.")
	case "full_withhold":
		reasons = append(reasons, "Decision engine requested full withhold due to risk indicators.")
	default:
		reasons = append(reasons, "Decision engine is awaiting a deterministic outcome.")
	}

	switch statusNormalized {
	case "paid":
		reasons = append(reasons, "Payout has been credited to the worker wallet.")
	case "approved":
		reasons = append(reasons, "Claim is approved and queued for payout processing.")
	case "under_review":
		reasons = append(reasons, "Claim remains under review until final fraud adjudication.")
	case "rejected":
		reasons = append(reasons, "Claim is rejected under current policy risk constraints.")
	default:
		reasons = append(reasons, "Claim was ingested and is pending downstream lifecycle updates.")
	}

	if normalizePayoutStatus(payoutStatus) == payoutStatusFailed {
		reasons = append(reasons, "Associated payout attempt failed and requires support intervention.")
	}

	return reasons
}

func (a *App) getWalletV1(c *gin.Context) {
	userID, err := readUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	includeEntries := strings.EqualFold(strings.TrimSpace(c.Query("include_entries")), "true")
	limit := parseListLimit(c)
	offset := parseListOffset(c)

	row := WalletResponse{
		UserID:    userID,
		Balance:   0,
		Currency:  strings.ToUpper(defaultPayoutCurrencyLower),
		UpdatedAt: time.Now().UTC(),
	}

	tx := a.db.WithContext(c.Request.Context()).
		Table("ledgers").
		Select("user_id, balance, updated_at").
		Where("user_id = ?", userID).
		Limit(1).
		Find(&row)
	if tx.Error != nil {
		if isCanceledRequestError(c.Request.Context(), tx.Error) {
			c.Status(499)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch wallet"})
		return
	}

	currency := strings.ToLower(strings.TrimSpace(a.cfg.StripeCurrency))
	if currency == "" {
		currency = defaultPayoutCurrencyLower
	}

	entries := make([]walletEntryItem, 0)
	totalEntries := int64(0)
	if includeEntries {
		entryBase := a.db.WithContext(c.Request.Context()).
			Table("ledger_entries").
			Where("user_id = ?", userID)

		if err := entryBase.Count(&totalEntries).Error; err != nil {
			if isCanceledRequestError(c.Request.Context(), err) {
				c.Status(499)
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count wallet entries"})
			return
		}

		rows := make([]struct {
			ID                  string    `json:"id"`
			PayoutTransactionID string    `json:"payout_transaction_id"`
			EventID             string    `json:"event_id"`
			Amount              float64   `json:"amount"`
			EntryType           string    `json:"entry_type"`
			Source              string    `json:"source"`
			CreatedAt           time.Time `json:"created_at"`
		}, 0, limit)

		if err := entryBase.
			Select("id, payout_transaction_id, event_id, amount, entry_type, source, created_at").
			Order("created_at DESC").
			Limit(limit).
			Offset(offset).
			Scan(&rows).Error; err != nil {
			if isCanceledRequestError(c.Request.Context(), err) {
				c.Status(499)
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch wallet entries"})
			return
		}

		for _, row := range rows {
			entries = append(entries, walletEntryItem{
				EntryID:   row.ID,
				PayoutID:  strings.TrimSpace(row.PayoutTransactionID),
				EventID:   row.EventID,
				Amount:    row.Amount,
				EntryType: row.EntryType,
				Source:    row.Source,
				CreatedAt: row.CreatedAt,
			})
		}
	}

	returned := len(entries)
	hasMore := int64(offset+returned) < totalEntries

	c.JSON(http.StatusOK, walletV1Response{
		WorkerID:  userID,
		Currency:  currency,
		Balance:   row.Balance,
		UpdatedAt: row.UpdatedAt,
		AsOf:      time.Now().UTC(),
		Entries:   entries,
		Pagination: listPagination{
			Limit:    limit,
			Offset:   offset,
			Returned: returned,
			Total:    totalEntries,
			HasMore:  hasMore,
		},
	})
}

func (a *App) listPayoutsV1(c *gin.Context) {
	userID, err := readUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	limit := parseListLimit(c)
	offset := parseListOffset(c)

	statuses := parseCSVFilter(c.Query("status"), normalizePayoutStatus)
	decisions := parseCSVFilter(c.Query("decision"), normalizeDecision)
	eventID := strings.TrimSpace(c.Query("event_id"))
	from, err := parseTimeFilter(c.Query("from"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	to, err := parseTimeFilter(c.Query("to"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	base := a.db.WithContext(c.Request.Context()).
		Table("payout_transactions pt").
		Joins("LEFT JOIN claims c ON c.id::text = pt.claim_id").
		Where("pt.user_id = ?", userID)

	if len(statuses) > 0 {
		base = base.Where("LOWER(pt.status) IN ?", statuses)
	}
	if len(decisions) > 0 {
		base = base.Where("LOWER(COALESCE(c.decision, 'auto_approve')) IN ?", decisions)
	}
	if eventID != "" {
		base = base.Where("pt.event_id = ?", eventID)
	}
	if from != nil {
		base = base.Where("pt.created_at >= ?", *from)
	}
	if to != nil {
		base = base.Where("pt.created_at <= ?", *to)
	}

	var total int64
	if err := base.Count(&total).Error; err != nil {
		if isCanceledRequestError(c.Request.Context(), err) {
			c.Status(499)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count payouts"})
		return
	}

	rows := make([]struct {
		PayoutID      string     `json:"payout_id"`
		ClaimID       string     `json:"claim_id"`
		EventID       string     `json:"event_id"`
		Amount        float64    `json:"amount"`
		Status        string     `json:"status"`
		Decision      string     `json:"decision"`
		CreatedAt     time.Time  `json:"created_at"`
		ProcessedAt   *time.Time `json:"processed_at"`
		FailureReason string     `json:"failure_reason"`
		Currency      string     `json:"currency"`
	}, 0, limit)

	if err := base.
		Select(`
			pt.id AS payout_id,
			pt.claim_id,
			pt.event_id,
			pt.amount,
			pt.status,
			COALESCE(c.decision, 'auto_approve') AS decision,
			pt.created_at,
			pt.processed_at,
			COALESCE(pt.error_message, '') AS failure_reason,
			pt.currency`).
		Order("pt.created_at DESC").
		Limit(limit).
		Offset(offset).
		Scan(&rows).Error; err != nil {
		if isCanceledRequestError(c.Request.Context(), err) {
			c.Status(499)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch payout history"})
		return
	}

	currency := strings.ToLower(strings.TrimSpace(a.cfg.StripeCurrency))
	if currency == "" {
		currency = defaultPayoutCurrencyLower
	}

	items := make([]payoutListV1Item, 0, len(rows))
	for _, row := range rows {
		if strings.TrimSpace(row.Currency) != "" {
			currency = strings.ToLower(strings.TrimSpace(row.Currency))
		}
		etaMinutes, nextAction, _ := payoutSupportHints(row.Status, row.FailureReason)
		items = append(items, payoutListV1Item{
			PayoutID:      row.PayoutID,
			ClaimID:       row.ClaimID,
			EventID:       row.EventID,
			WorkerID:      userID,
			Amount:        row.Amount,
			Currency:      currency,
			Status:        normalizePayoutStatus(row.Status),
			StatusLabel:   payoutStatusLabel(row.Status),
			Decision:      normalizeDecision(row.Decision),
			DecisionLabel: decisionLabel(row.Decision),
			CreatedAt:     row.CreatedAt,
			ProcessedAt:   row.ProcessedAt,
			FailureReason: strings.TrimSpace(row.FailureReason),
			ETAMinutes:    etaMinutes,
			NextAction:    nextAction,
		})
	}

	returned := len(items)
	hasMore := int64(offset+returned) < total

	filters := payoutListV1Filters{
		Statuses:  statuses,
		Decisions: decisions,
		EventID:   eventID,
	}
	if from != nil {
		filters.From = from.Format(time.RFC3339)
	}
	if to != nil {
		filters.To = to.Format(time.RFC3339)
	}

	c.JSON(http.StatusOK, payoutListV1Response{
		WorkerID: userID,
		Currency: currency,
		AsOf:     time.Now().UTC(),
		Pagination: listPagination{
			Limit:    limit,
			Offset:   offset,
			Returned: returned,
			Total:    total,
			HasMore:  hasMore,
		},
		Filters: filters,
		Items:   items,
	})
}

func (a *App) listClaimsV1(c *gin.Context) {
	userID, err := readUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	limit := parseListLimit(c)
	offset := parseListOffset(c)

	statuses := parseCSVFilter(c.Query("status"), normalizeClaimStatus)
	decisions := parseCSVFilter(c.Query("decision"), normalizeDecision)
	eventID := strings.TrimSpace(c.Query("event_id"))
	from, err := parseTimeFilter(c.Query("from"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	to, err := parseTimeFilter(c.Query("to"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	base := a.db.WithContext(c.Request.Context()).
		Table("claims c").
		Joins("LEFT JOIN payout_transactions pt ON pt.claim_id = c.id::text").
		Where("c.user_id = ?", userID)

	if len(statuses) > 0 {
		base = base.Where("LOWER(COALESCE(c.status::text, '')) IN ?", statuses)
	}
	if len(decisions) > 0 {
		base = base.Where("LOWER(COALESCE(c.decision, '')) IN ?", decisions)
	}
	if eventID != "" {
		base = base.Where("c.event_id = ?", eventID)
	}
	if from != nil {
		base = base.Where("COALESCE(c.created_at, NOW()) >= ?", *from)
	}
	if to != nil {
		base = base.Where("COALESCE(c.created_at, NOW()) <= ?", *to)
	}

	var total int64
	if err := base.Count(&total).Error; err != nil {
		if isCanceledRequestError(c.Request.Context(), err) {
			c.Status(499)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count claims"})
		return
	}

	rows := make([]struct {
		ClaimID      string    `json:"claim_id"`
		EventID      string    `json:"event_id"`
		UserID       string    `json:"user_id"`
		FRSScore     float64   `json:"frs_score"`
		Decision     string    `json:"decision"`
		Status       string    `json:"status"`
		CreatedAt    time.Time `json:"created_at"`
		PayoutID     string    `json:"payout_id"`
		PayoutStatus string    `json:"payout_status"`
		PayoutAmount float64   `json:"payout_amount"`
	}, 0, limit)

	if err := base.
		Select(`
			COALESCE(c.id::text, '') AS claim_id,
			COALESCE(c.event_id, '') AS event_id,
			COALESCE(c.user_id, '') AS user_id,
			COALESCE(c.frs_score, 0) AS frs_score,
			COALESCE(c.decision, '') AS decision,
			COALESCE(c.status::text, '') AS status,
			COALESCE(c.created_at, NOW()) AS created_at,
			COALESCE(pt.id, '') AS payout_id,
			COALESCE(pt.status, '') AS payout_status,
			COALESCE(pt.amount, 0) AS payout_amount`).
		Order("COALESCE(c.created_at, NOW()) DESC").
		Limit(limit).
		Offset(offset).
		Scan(&rows).Error; err != nil {
		if isCanceledRequestError(c.Request.Context(), err) {
			c.Status(499)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch claims"})
		return
	}

	items := make([]claimListV1Item, 0, len(rows))
	for _, row := range rows {
		normalizedStatus := normalizeClaimStatus(row.Status)
		normalizedDecision := normalizeDecision(row.Decision)
		items = append(items, claimListV1Item{
			ClaimID:       row.ClaimID,
			EventID:       row.EventID,
			WorkerID:      row.UserID,
			Status:        normalizedStatus,
			StatusLabel:   claimStatusLabel(normalizedStatus),
			Decision:      normalizedDecision,
			DecisionLabel: decisionLabel(normalizedDecision),
			FRSScore:      row.FRSScore,
			RiskOutcome:   deriveRiskOutcome(normalizedDecision, row.FRSScore),
			PayoutID:      strings.TrimSpace(row.PayoutID),
			PayoutStatus:  normalizePayoutStatus(row.PayoutStatus),
			PayoutAmount:  roundCurrency(row.PayoutAmount),
			CreatedAt:     row.CreatedAt,
		})
	}

	returned := len(items)
	hasMore := int64(offset+returned) < total

	filters := claimListV1Filters{
		Statuses:  statuses,
		Decisions: decisions,
		EventID:   eventID,
	}
	if from != nil {
		filters.From = from.Format(time.RFC3339)
	}
	if to != nil {
		filters.To = to.Format(time.RFC3339)
	}

	c.JSON(http.StatusOK, claimListV1Response{
		WorkerID: userID,
		AsOf:     time.Now().UTC(),
		Pagination: listPagination{
			Limit:    limit,
			Offset:   offset,
			Returned: returned,
			Total:    total,
			HasMore:  hasMore,
		},
		Filters: filters,
		Items:   items,
	})
}

func (a *App) getClaimDetail(c *gin.Context) {
	claimID := strings.TrimSpace(c.Param("claim_id"))
	if claimID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "claim_id path parameter is required"})
		return
	}

	userID := strings.TrimSpace(c.Query("worker_id"))
	if userID == "" {
		userID = strings.TrimSpace(c.Query("user_id"))
	}

	row := struct {
		ClaimID        string     `json:"claim_id"`
		EventID        string     `json:"event_id"`
		UserID         string     `json:"user_id"`
		Decision       string     `json:"decision"`
		Status         string     `json:"status"`
		FRSScore       float64    `json:"frs_score"`
		ClaimCreatedAt time.Time  `json:"claim_created_at"`
		PayoutID       string     `json:"payout_id"`
		PayoutStatus   string     `json:"payout_status"`
		PayoutAmount   float64    `json:"payout_amount"`
		PayoutCurrency string     `json:"payout_currency"`
		PayoutCreatedAt *time.Time `json:"payout_created_at"`
		PayoutUpdatedAt *time.Time `json:"payout_updated_at"`
		ProcessedAt    *time.Time `json:"processed_at"`
		FailureReason  string     `json:"failure_reason"`
		Zone           string     `json:"zone"`
		WagePerHour    float64    `json:"wage_per_hour"`
	}{
		WagePerHour: defaultWagePerHour,
	}

	query := a.db.WithContext(c.Request.Context()).
		Table("claims c").
		Select(`
			COALESCE(c.id::text, '') AS claim_id,
			COALESCE(c.event_id, '') AS event_id,
			COALESCE(c.user_id, '') AS user_id,
			COALESCE(c.decision, '') AS decision,
			COALESCE(c.status::text, '') AS status,
			COALESCE(c.frs_score, 0) AS frs_score,
			COALESCE(c.created_at, NOW()) AS claim_created_at,
			COALESCE(pt.id, '') AS payout_id,
			COALESCE(pt.status, '') AS payout_status,
			COALESCE(pt.amount, 0) AS payout_amount,
			COALESCE(pt.currency, '') AS payout_currency,
			pt.created_at AS payout_created_at,
			pt.updated_at AS payout_updated_at,
			pt.processed_at,
			COALESCE(pt.error_message, '') AS failure_reason,
			COALESCE(u.zone, '') AS zone,
			COALESCE(u.wage_per_hour, 150) AS wage_per_hour`).
		Joins("LEFT JOIN users u ON u.id = c.user_id").
		Joins("LEFT JOIN payout_transactions pt ON pt.claim_id = c.id::text").
		Where("c.id::text = ?", claimID)

	if userID != "" {
		query = query.Where("c.user_id = ?", userID)
	}

	if err := query.Order("pt.created_at DESC NULLS LAST").Limit(1).Scan(&row).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "claim not found"})
			return
		}
		if isCanceledRequestError(c.Request.Context(), err) {
			c.Status(499)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch claim detail"})
		return
	}

	if strings.TrimSpace(row.ClaimID) == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "claim not found"})
		return
	}

	normalizedDecision := normalizeDecision(row.Decision)
	normalizedStatus := normalizeClaimStatus(row.Status)
	normalizedPayoutStatus := normalizePayoutStatus(row.PayoutStatus)

	claimAmount := roundCurrency(row.PayoutAmount)
	if claimAmount <= 0 {
		claimAmount = roundCurrency(row.WagePerHour * 4)
	}

	verifiedAt := row.ClaimCreatedAt.Add(45 * time.Second)
	var approvedAt *time.Time
	var paidAt *time.Time

	if normalizedDecision == "auto_approve" || normalizedStatus == "approved" || normalizedStatus == "paid" {
		when := verifiedAt.Add(45 * time.Second)
		if row.PayoutCreatedAt != nil {
			when = row.PayoutCreatedAt.UTC()
		}
		approvedAt = &when
	}

	if row.ProcessedAt != nil {
		processed := row.ProcessedAt.UTC()
		paidAt = &processed
	} else if normalizedStatus == "paid" && approvedAt != nil {
		fallbackPaidAt := approvedAt.Add(30 * time.Second)
		paidAt = &fallbackPaidAt
	}

	lastUpdatedAt := row.ClaimCreatedAt
	if row.PayoutUpdatedAt != nil && row.PayoutUpdatedAt.After(lastUpdatedAt) {
		lastUpdatedAt = row.PayoutUpdatedAt.UTC()
	}

	normalizedScore := normalizeFraudScore(row.FRSScore)
	fraudOutcome := deriveRiskOutcome(normalizedDecision, row.FRSScore)

	currency := strings.ToLower(strings.TrimSpace(row.PayoutCurrency))
	if currency == "" {
		currency = defaultPayoutCurrencyLower
	}

	nextAction := "monitor_claim_status"
	switch {
	case normalizedStatus == "paid":
		nextAction = "none"
	case normalizedStatus == "approved":
		nextAction = "wait_for_payout_credit"
	case normalizedStatus == "under_review":
		nextAction = "await_manual_review"
	case normalizedStatus == "rejected":
		nextAction = "contact_support_if_disputed"
	case normalizedPayoutStatus == payoutStatusFailed:
		nextAction = "contact_support_with_payout_reference"
	}

	evidence := make([]claimDetailEvidence, 0, 4)
	claimCreatedAt := row.ClaimCreatedAt.UTC()
	evidence = append(evidence,
		claimDetailEvidence{
			Type:      "claim_record",
			Source:    "core_claims",
			Title:     "Claim record",
			Value:     row.ClaimID,
			Timestamp: &claimCreatedAt,
		},
	)
	if strings.TrimSpace(row.EventID) != "" {
		evidence = append(evidence, claimDetailEvidence{
			Type:      "event_reference",
			Source:    "oracle_event",
			Title:     "Triggered event reference",
			Value:     row.EventID,
			Timestamp: &claimCreatedAt,
		})
	}
	if strings.TrimSpace(row.PayoutID) != "" {
		payoutTs := claimCreatedAt
		if row.PayoutCreatedAt != nil {
			payoutTs = row.PayoutCreatedAt.UTC()
		}
		evidence = append(evidence, claimDetailEvidence{
			Type:      "payout_transaction",
			Source:    "payout_ledger",
			Title:     "Linked payout transaction",
			Value:     row.PayoutID,
			Timestamp: &payoutTs,
		})
	}
	if strings.TrimSpace(row.Zone) != "" {
		evidence = append(evidence, claimDetailEvidence{
			Type:      "worker_zone",
			Source:    "worker_profile",
			Title:     "Worker zone at claim time",
			Value:     row.Zone,
			Timestamp: &claimCreatedAt,
		})
	}

	response := claimDetailResponse{
		ClaimID:       row.ClaimID,
		EventID:       row.EventID,
		WorkerID:      row.UserID,
		Zone:          row.Zone,
		EventType:     "disruption_event",
		Status:        normalizedStatus,
		StatusLabel:   claimStatusLabel(normalizedStatus),
		Decision:      normalizedDecision,
		DecisionLabel: decisionLabel(normalizedDecision),
		ClaimAmount:   claimAmount,
		PayoutAmount:  roundCurrency(row.PayoutAmount),
		Currency:      currency,
		Timeline: claimDetailTimeline{
			SubmittedAt:   claimCreatedAt,
			VerifiedAt:    &verifiedAt,
			ApprovedAt:    approvedAt,
			PaidAt:        paidAt,
			LastUpdatedAt: lastUpdatedAt,
		},
		DecisionSummary: decisionSummaryForClaim(normalizedDecision, normalizedStatus, row.FRSScore),
		DecisionReasons: decisionReasonsForClaim(normalizedDecision, normalizedStatus, row.FRSScore, normalizedPayoutStatus),
		FraudOutput: claimDetailFraudOutput{
			FRSScore:        row.FRSScore,
			NormalizedScore: normalizedScore,
			Threshold:       0.65,
			Outcome:         fraudOutcome,
			Decision:        normalizedDecision,
			RiskFlags:       inferRiskFlags(normalizedDecision, row.FRSScore, normalizedPayoutStatus),
			ModelVersion:    "frs-v2.6",
			EvaluatedAt:     claimCreatedAt,
		},
		Evidence:   evidence,
		NextAction: nextAction,
	}

	c.JSON(http.StatusOK, response)
}

func (a *App) getPayoutSupport(c *gin.Context) {
	userID, err := readUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	payoutID := strings.TrimSpace(c.Query("payout_id"))

	query := a.db.WithContext(c.Request.Context()).Table("payout_transactions").Where("user_id = ?", userID)
	if payoutID != "" {
		query = query.Where("id = ?", payoutID)
	}

	row := struct {
		ID          string `json:"id"`
		Status      string `json:"status"`
		ErrorReason string `json:"error_message"`
	}{
		Status: payoutStatusPending,
	}

	if err := query.Order("created_at DESC").Limit(1).Scan(&row).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "payout not found"})
			return
		}
		if isCanceledRequestError(c.Request.Context(), err) {
			c.Status(499)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch payout support details"})
		return
	}

	if strings.TrimSpace(row.ID) == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "payout not found"})
		return
	}

	etaMinutes, nextAction, hint := payoutSupportHints(row.Status, row.ErrorReason)

	c.JSON(http.StatusOK, payoutSupportResponse{
		WorkerID:      userID,
		PayoutID:      row.ID,
		Status:        normalizePayoutStatus(row.Status),
		StatusLabel:   payoutStatusLabel(row.Status),
		ETAMinutes:    etaMinutes,
		NextAction:    nextAction,
		SupportHint:   hint,
		FailureReason: strings.TrimSpace(row.ErrorReason),
	})
}

func (a *App) upgradeTier(c *gin.Context) {
	var req tierUpgradeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TargetTier < 1 || req.TargetTier > 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "target_tier must be between 1 and 3"})
		return
	}

	var user User
	if err := a.db.WithContext(c.Request.Context()).Where("id = ?", strings.TrimSpace(req.UserID)).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load user"})
		return
	}

	if req.TargetTier <= user.RiskTier {
		c.JSON(http.StatusConflict, gin.H{"error": "target_tier must be greater than current tier"})
		return
	}

	oldTier := user.RiskTier
	oldPremium := user.WeeklyPremium
	newPremium := tierFallbackPremium(req.TargetTier)

	user.RiskTier = req.TargetTier
	user.WeeklyPremium = newPremium

	if err := a.db.WithContext(c.Request.Context()).Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to upgrade tier"})
		return
	}

	if err := a.refreshPolicyLifecycle(c.Request.Context(), &user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to refresh policy after tier upgrade", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tierUpgradeResponse{
		Message:          "tier upgraded successfully",
		OldTier:          oldTier,
		NewTier:          user.RiskTier,
		OldWeeklyPremium: roundCurrency(oldPremium),
		NewWeeklyPremium: roundCurrency(user.WeeklyPremium),
		PremiumDelta:     roundCurrency(user.WeeklyPremium - oldPremium),
		Reason:           strings.TrimSpace(req.Reason),
		User:             buildAuthPayload(user),
	})
}
