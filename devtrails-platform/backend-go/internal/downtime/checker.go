package downtime

import (
	"net/http"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Target struct {
	Service string
	Zone    string
	URL     string
}

// Configured endpoints (e.g. simulating location-based endpoints for Swiggy)
var Targets = []Target{
	{"swiggy", "chennai", "https://www.swiggy.com/city/chennai"},
	{"swiggy", "coimbatore", "https://www.swiggy.com/city/coimbatore"},
	{"swiggy", "bangalore", "https://www.swiggy.com/city/bangalore"},
}

// StartPoller runs in the background and hits external services periodically
func StartPoller(db *gorm.DB) {
	ticker := time.NewTicker(3 * time.Minute)
	defer ticker.Stop()

	// Initial immediate check
	checkTargets(db)

	for range ticker.C {
		checkTargets(db)
	}
}

func checkTargets(db *gorm.DB) {
	client := http.Client{
		Timeout: 10 * time.Second, // don't hang forever
	}

	for _, t := range Targets {
		start := time.Now()
		resp, err := client.Get(t.URL)

		latency := time.Since(start).Milliseconds()
		isUp := false
		statusCode := 0

		if err == nil {
			statusCode = resp.StatusCode
			if statusCode >= 200 && statusCode < 400 {
				isUp = true
			}
			resp.Body.Close()
		}

		health := ServiceHealth{
			ID:         uuid.New().String(),
			Service:    t.Service,
			Zone:       t.Zone,
			IsUp:       isUp,
			StatusCode: statusCode,
			LatencyMs:  latency,
			CheckedAt:  time.Now().UTC(),
		}

		db.Create(&health)
	}
}
