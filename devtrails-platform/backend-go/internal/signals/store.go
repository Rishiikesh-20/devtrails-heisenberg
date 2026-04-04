package signals

import (
	"time"

	"gorm.io/gorm"
)

type WeatherSignal struct {
	ID               string    `gorm:"type:uuid;primaryKey" json:"id"`
	Zone             string    `gorm:"index;not null" json:"zone"`
	Latitude         float64   `gorm:"type:numeric(9,6);not null" json:"latitude"`
	Longitude        float64   `gorm:"type:numeric(9,6);not null" json:"longitude"`
	PrecipitationMM  float64   `gorm:"type:numeric(8,4);not null" json:"precipitation_mm"`
	RainMM           float64   `gorm:"type:numeric(8,4);not null" json:"rain_mm"`
	WindSpeedKMH     float64   `gorm:"type:numeric(6,2);not null" json:"wind_speed_kmh"`
	WeatherCode      int       `gorm:"not null" json:"weather_code"`
	WeatherSummary   string    `gorm:"not null" json:"weather_summary"`
	ThresholdCrossed bool      `gorm:"index;not null" json:"threshold_crossed"`
	EventType        string    `gorm:"index;not null" json:"event_type"`
	SeverityFactor   float64   `gorm:"type:numeric(4,2);not null" json:"severity_factor"`
	PolledAt         time.Time `gorm:"index;not null" json:"polled_at"`
	CreatedAt        time.Time `json:"created_at"`
}

type SignalQueryFilters struct {
	Zone             *string
	EventType        *string
	ThresholdCrossed *bool
	Limit            int
}

func SaveSignal(db *gorm.DB, r SignalReading, id string) (*WeatherSignal, error) {
	ws := &WeatherSignal{
		ID:               id,
		Zone:             r.Zone,
		Latitude:         r.Latitude,
		Longitude:        r.Longitude,
		PrecipitationMM:  r.PrecipitationMM,
		RainMM:           r.RainMM,
		WindSpeedKMH:     r.WindSpeedKMH,
		WeatherCode:      r.WeatherCode,
		WeatherSummary:   r.WeatherSummary,
		ThresholdCrossed: r.ThresholdCrossed,
		EventType:        r.EventType,
		SeverityFactor:   r.SeverityFactor,
		PolledAt:         r.PolledAt,
		CreatedAt:        time.Now().UTC(),
	}

	if err := db.Create(ws).Error; err != nil {
		return nil, err
	}
	return ws, nil
}

func QuerySignals(db *gorm.DB, filters SignalQueryFilters) ([]WeatherSignal, error) {
	query := db.Model(&WeatherSignal{})

	if filters.Zone != nil && *filters.Zone != "" {
		query = query.Where("zone = ?", *filters.Zone)
	}
	if filters.EventType != nil && *filters.EventType != "" {
		query = query.Where("event_type = ?", *filters.EventType)
	}
	if filters.ThresholdCrossed != nil {
		query = query.Where("threshold_crossed = ?", *filters.ThresholdCrossed)
	}

	limit := filters.Limit
	if limit <= 0 {
		limit = 50
	} else if limit > 200 {
		limit = 200
	}
	query = query.Limit(limit).Order("polled_at DESC")

	var results []WeatherSignal
	if err := query.Find(&results).Error; err != nil {
		return nil, err
	}

	return results, nil
}
