package reports

import (
	"context"
	"time"

	"gorm.io/gorm"
)

// EvaluateReport calculates report authenticity based on time bounds, quality, rate-limits, and consensus.
func EvaluateReport(ctx context.Context, db *gorm.DB, report *UserReport) error {
	now := time.Now().UTC()
	if report.ReportedAt.After(now.Add(1*time.Minute)) || report.ReportedAt.Before(now.Add(-24*time.Hour)) {
		report.Status = "rejected"
		report.AuthenticityScore = 0
		return nil
	}

	score := 20

	if len(report.Details) > 20 {
		score += 10
	} else if len(report.Details) < 5 && report.Details != "" {
		score -= 10
	}

	var recentUserReports int64
	db.Model(&UserReport{}).
		Where("user_id = ? AND reported_at >= ?", report.UserID, now.Add(-15*time.Minute)).
		Count(&recentUserReports)

	if recentUserReports >= 5 {
		report.Status = "rejected"
		report.AuthenticityScore = 0
		return nil
	} else if recentUserReports > 1 {
		score -= 15
	}

	var duplicateReports int64
	db.Model(&UserReport{}).
		Where("user_id = ? AND category = ? AND zone = ? AND reported_at >= ?",
			report.UserID, report.Category, report.Zone, now.Add(-1*time.Hour)).
		Count(&duplicateReports)

	if duplicateReports > 0 {
		report.Status = "rejected"
		report.AuthenticityScore = 0
		return nil
	}

	var consensusCount int64
	db.Model(&UserReport{}).
		Where("zone = ? AND category = ? AND reported_at >= ? AND user_id != ?",
			report.Zone, report.Category, now.Add(-15*time.Minute), report.UserID).
		Count(&consensusCount)

	score += int(consensusCount) * 30

	if score > 100 {
		score = 100
	} else if score < 0 {
		score = 0
	}

	report.AuthenticityScore = score

	if score >= 80 {
		report.Status = "verified"
	} else {
		report.Status = "pending"
	}

	return nil
}
