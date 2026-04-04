package downtime

import (
	"gorm.io/gorm"
)

func GetLatestHealth(db *gorm.DB, service, zone string) (ServiceHealth, error) {
	var health ServiceHealth
	err := db.Where("service = ? AND zone = ?", service, zone).
		Order("checked_at desc").
		First(&health).Error
	return health, err
}
