package reports

import (
	"gorm.io/gorm"
)

type ReportQueryFilters struct {
	UserID   *string
	Zone     *string
	Category *string
	Status   *string
	Limit    int
	Offset   int
}

func SaveReport(db *gorm.DB, report *UserReport) error {
	return db.Create(report).Error
}

func QueryReports(db *gorm.DB, filters ReportQueryFilters) ([]UserReport, int64, error) {
	query := db.Model(&UserReport{})

	if filters.UserID != nil && *filters.UserID != "" {
		query = query.Where("user_id = ?", *filters.UserID)
	}

	if filters.Zone != nil && *filters.Zone != "" {
		query = query.Where("zone = ?", *filters.Zone)
	}
	if filters.Category != nil && *filters.Category != "" {
		query = query.Where("category = ?", *filters.Category)
	}
	if filters.Status != nil && *filters.Status != "" {
		query = query.Where("status = ?", *filters.Status)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	limit := filters.Limit
	if limit <= 0 {
		limit = 50
	} else if limit > 200 {
		limit = 200
	}

	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	var results []UserReport
	if err := query.Limit(limit).Offset(offset).Order("reported_at DESC").Find(&results).Error; err != nil {
		return nil, 0, err
	}

	return results, total, nil
}
