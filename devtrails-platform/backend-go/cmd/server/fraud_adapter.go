package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"time"
)

const (
	maxFraudEngineErrorBodyBytes = 8 * 1024
	defaultFraudEngineTimeout    = 8 * time.Second
)

type Claim struct {
	ClaimID           string    `json:"claim_id"`
	WorkerID          string    `json:"worker_id"`
	PolicyID          string    `json:"policy_id"`
	PolicyStartedAt   time.Time `json:"policy_started_at"`
	IsRenewal         bool      `json:"is_renewal"`
	ClaimedAmount     float64   `json:"claimed_amount"`
	Currency          string    `json:"currency"`
	AvgWeeklyEarnings float64   `json:"avg_weekly_earnings"`
	RecentClaims      int       `json:"recent_claims"`
	DeviceLinkCount   int       `json:"device_link_count"`
	AccountLinkCount  int       `json:"account_link_count"`
}

type FraudRequest struct {
	Claims []Claim `json:"claims"`
}

type FraudResult struct {
	ClaimID   string   `json:"claim_id"`
	WorkerID  string   `json:"worker_id"`
	FRSScore  int      `json:"frs_score"`
	Decision  string   `json:"decision"`
	RiskFlags []string `json:"risk_flags,omitempty"`
}

type FraudResponse struct {
	Results []FraudResult `json:"results"`
}

// Backward-compatible aliases used by existing orchestrator code.
type FRSResult = FraudResult
type BatchFRSResponse = FraudResponse

func SendClaimsToFraudEngine(
	ctx context.Context,
	httpClient *http.Client,
	fraudEngineURL string,
	claims []Claim,
) ([]FraudResult, error) {
	if httpClient == nil {
		httpClient = &http.Client{Timeout: defaultFraudEngineTimeout}
	}

	if httpClient.Timeout <= 0 {
		copyClient := *httpClient
		copyClient.Timeout = defaultFraudEngineTimeout
		httpClient = &copyClient
	}

	if strings.TrimSpace(fraudEngineURL) == "" {
		return nil, errors.New("fraud engine url is empty")
	}

	if len(claims) == 0 {
		return []FraudResult{}, nil
	}

	requestContext := ctx
	if requestContext == nil {
		requestContext = context.Background()
	}
	if _, hasDeadline := requestContext.Deadline(); !hasDeadline {
		cancelCtx, cancel := context.WithTimeout(requestContext, httpClient.Timeout)
		defer cancel()
		requestContext = cancelCtx
	}

	payload, err := json.Marshal(FraudRequest{Claims: claims})
	if err != nil {
		return nil, fmt.Errorf("marshal fraud request: %w", err)
	}

	endpoint := strings.TrimRight(fraudEngineURL, "/") + "/verify-claims"
	req, err := http.NewRequestWithContext(requestContext, http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("build verify-claims request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			return nil, fmt.Errorf("verify-claims request timed out: %w", err)
		}
		var netErr net.Error
		if errors.As(err, &netErr) && netErr.Timeout() {
			return nil, fmt.Errorf("verify-claims request timed out: %w", err)
		}
		return nil, fmt.Errorf("request verify-claims: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, maxFraudEngineErrorBodyBytes))
		return nil, fmt.Errorf("verify-claims returned status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read verify-claims response: %w", err)
	}

	var parsed FraudResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("decode verify-claims response: %w", err)
	}

	if parsed.Results == nil {
		return nil, errors.New("verify-claims response missing results")
	}

	return parsed.Results, nil
}

func SendBatchClaimsToFraudEngine(
	ctx context.Context,
	httpClient *http.Client,
	fraudEngineURL string,
	eventID string,
	eventType string,
	zoneID string,
	claims []Claim,
	validator *ContractValidator,
) ([]FRSResult, error) {
	_ = eventID
	_ = eventType
	_ = zoneID
	_ = validator

	results, err := SendClaimsToFraudEngine(ctx, httpClient, fraudEngineURL, claims)
	if err != nil {
		return nil, err
	}

	return results, nil
}
