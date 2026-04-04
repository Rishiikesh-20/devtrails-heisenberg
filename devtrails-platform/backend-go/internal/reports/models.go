package reports

import (
	"time"
)

type UserReport struct {
	ID                string    `gorm:"type:uuid;primaryKey" json:"id"`
	UserID            string    `gorm:"index;not null" json:"user_id"`
	Zone              string    `gorm:"index;not null" json:"zone"`
	Category          string    `gorm:"index;not null" json:"category"`
	Severity          int       `gorm:"not null" json:"severity"`
	Details           string    `json:"details"`
	Status            string    `gorm:"index;not null;default:'pending'" json:"status"`
	AuthenticityScore int       `gorm:"not null;default:0" json:"authenticity_score"`
	ReportedAt        time.Time `gorm:"index;not null" json:"reported_at"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}
