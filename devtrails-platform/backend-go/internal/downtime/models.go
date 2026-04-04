package downtime

import "time"

type ServiceHealth struct {
	ID         string    `gorm:"type:uuid;primaryKey" json:"id"`
	Service    string    `gorm:"index;not null" json:"service"`
	Zone       string    `gorm:"index;not null" json:"zone"`
	IsUp       bool      `gorm:"not null" json:"is_up"`
	StatusCode int       `json:"status_code"`
	LatencyMs  int64     `json:"latency_ms"`
	CheckedAt  time.Time `gorm:"index;not null" json:"checked_at"`
}
