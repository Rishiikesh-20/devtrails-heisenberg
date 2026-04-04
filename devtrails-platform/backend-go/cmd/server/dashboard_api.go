package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	defaultListLimit = 20
	maxListLimit     = 100
)

type WalletResponse struct {
	UserID    string    `json:"user_id"`
	Balance   float64   `json:"balance"`
	Currency  string    `json:"currency"`
	UpdatedAt time.Time `json:"updated_at"`
}

type PayoutListItem struct {
	PayoutID      string     `json:"payout_id"`
	ClaimID       string     `json:"claim_id"`
	EventID       string     `json:"event_id"`
	Amount        float64    `json:"amount"`
	Status        string     `json:"status"`
	Decision      string     `json:"decision"`
	CreatedAt     time.Time  `json:"created_at"`
	ProcessedAt   *time.Time `json:"processed_at"`
	FailureReason string     `json:"failure_reason,omitempty"`
}

type PayoutListResponse struct {
	WorkerID string           `json:"worker_id"`
	Currency string           `json:"currency"`
	AsOf     time.Time        `json:"as_of"`
	Items    []PayoutListItem `json:"items"`
}

type ClaimListItem struct {
	EventID   string    `json:"event_id"`
	UserID    string    `json:"user_id"`
	FRSScore  float64   `json:"frs_score"`
	Decision  string    `json:"decision"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type ClaimListResponse struct {
	UserID string          `json:"user_id"`
	Items  []ClaimListItem `json:"items"`
}

func readUserID(c *gin.Context) (string, error) {
	userID := strings.TrimSpace(c.Query("worker_id"))
	if userID == "" {
		userID = strings.TrimSpace(c.Query("user_id"))
	}
	if userID == "" {
		return "", fmt.Errorf("missing required query parameter: worker_id")
	}
	return userID, nil
}

func parseListLimit(c *gin.Context) int {
	limitRaw := strings.TrimSpace(c.Query("limit"))
	if limitRaw == "" {
		return defaultListLimit
	}

	parsed, err := strconv.Atoi(limitRaw)
	if err != nil {
		return defaultListLimit
	}
	if parsed <= 0 {
		return defaultListLimit
	}
	if parsed > maxListLimit {
		return maxListLimit
	}
	return parsed
}

func (a *App) getWallet(c *gin.Context) {
	userID, err := readUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

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

	if tx.RowsAffected == 0 {
		row.UserID = userID
		c.JSON(http.StatusOK, row)
		return
	}

	row.Currency = strings.ToUpper(strings.TrimSpace(a.cfg.StripeCurrency))
	if row.Currency == "" {
		row.Currency = strings.ToUpper(defaultPayoutCurrencyLower)
	}

	c.JSON(http.StatusOK, row)
}

func (a *App) listPayouts(c *gin.Context) {
	userID, err := readUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	limit := parseListLimit(c)
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

	query := `
		SELECT
			pt.id AS payout_id,
			pt.claim_id,
			pt.event_id,
			pt.amount,
			pt.status,
			COALESCE(c.decision, 'auto_approve') AS decision,
			pt.created_at,
			pt.processed_at,
			COALESCE(pt.error_message, '') AS failure_reason,
			pt.currency
		FROM payout_transactions pt
		LEFT JOIN claims c ON c.id::text = pt.claim_id
		WHERE pt.user_id = $1
		ORDER BY pt.created_at DESC
		LIMIT $2
	`

	if err := a.db.WithContext(c.Request.Context()).Raw(query, userID, limit).Scan(&rows).Error; err != nil {
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

	items := make([]PayoutListItem, 0, len(rows))
	for _, row := range rows {
		if strings.TrimSpace(row.Currency) != "" {
			currency = strings.ToLower(strings.TrimSpace(row.Currency))
		}

		items = append(items, PayoutListItem{
			PayoutID:      row.PayoutID,
			ClaimID:       row.ClaimID,
			EventID:       row.EventID,
			Amount:        row.Amount,
			Status:        row.Status,
			Decision:      normalizeDecision(row.Decision),
			CreatedAt:     row.CreatedAt,
			ProcessedAt:   row.ProcessedAt,
			FailureReason: strings.TrimSpace(row.FailureReason),
		})
	}

	c.JSON(http.StatusOK, PayoutListResponse{WorkerID: userID, Currency: currency, AsOf: time.Now().UTC(), Items: items})
}

func (a *App) listClaims(c *gin.Context) {
	userID, err := readUserID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	limit := parseListLimit(c)
	items := make([]ClaimListItem, 0, limit)

	query := `
		SELECT
			COALESCE(event_id, '') AS event_id,
			COALESCE(user_id, '') AS user_id,
			COALESCE(frs_score, 0) AS frs_score,
			COALESCE(decision, '') AS decision,
			COALESCE(status::text, '') AS status,
			COALESCE(created_at, submitted_at, NOW()) AS created_at
		FROM claims
		WHERE user_id = $1
		ORDER BY COALESCE(created_at, submitted_at, NOW()) DESC
		LIMIT $2
	`

	if err := a.db.WithContext(c.Request.Context()).Raw(query, userID, limit).Scan(&items).Error; err != nil {
		if isCanceledRequestError(c.Request.Context(), err) {
			c.Status(499)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch claims"})
		return
	}

	c.JSON(http.StatusOK, ClaimListResponse{UserID: userID, Items: items})
}

func isCanceledRequestError(ctx context.Context, err error) bool {
	if err == nil {
		return false
	}

	if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
		return true
	}

	if ctx != nil {
		if errors.Is(ctx.Err(), context.Canceled) || errors.Is(ctx.Err(), context.DeadlineExceeded) {
			return true
		}
	}

	errMsg := strings.ToLower(err.Error())
	return strings.Contains(errMsg, "operation was canceled") || strings.Contains(errMsg, "context canceled")
}
