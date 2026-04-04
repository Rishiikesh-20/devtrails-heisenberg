package reports

import (
	"gorm.io/gorm"
)

type ReportQueryFilters struct {
	Zone     *string
	Category *string
	Status   *string
	Limit    int
}

func SaveReport(db *gorm.DB, report *UserReport) error {
	return db.Create(report).Error
}

func QueryReports(db *gorm.DB, filters ReportQueryFilters) ([]UserReport, error) {
	query := db.Model(&UserReport{})

	if filters.Zone != nil && *filters.Zone != "" {
		query = query.Where("zone = ?", *filters.Zone)
	}
	if filters.Category != nil && *filters.Category != "" {
		query = query.Where("category = ?", *filters.Category)
	}
	if filters.Status != nil && *filters.Status != "" {
		query = query.Where("status = ?", *filters.Status)
	}

	limit := filters.Limit
	if limit <= 0 {
		limit = 50
	} else if limit > 200 {
		limit = 200
	}

	var results []UserReport
	if err := query.Limit(limit).Order("reported_at DESC").Find(&results).Error; err != nil {
		return nil, err
	}

	return results, nil
}
