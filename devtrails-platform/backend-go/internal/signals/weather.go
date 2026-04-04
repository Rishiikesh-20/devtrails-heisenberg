package signals

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

type OpenMeteoResponse struct {
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
	Timezone     string  `json:"timezone"`
	Elevation    float64 `json:"elevation"`
	CurrentUnits struct {
		Precipitation string `json:"precipitation"`
		Rain          string `json:"rain"`
		Weathercode   string `json:"weathercode"`
		Windspeed10m  string `json:"windspeed_10m"`
	} `json:"current_units"`
	Current struct {
		Time          string  `json:"time"`
		Interval      int     `json:"interval"`
		Precipitation float64 `json:"precipitation"`
		Rain          float64 `json:"rain"`
		Weathercode   int     `json:"weathercode"`
		Windspeed10m  float64 `json:"windspeed_10m"`
	} `json:"current"`
}

type SignalReading struct {
	Zone             string
	Latitude         float64
	Longitude        float64
	PrecipitationMM  float64
	RainMM           float64
	WindSpeedKMH     float64
	WeatherCode      int
	WeatherSummary   string
	ThresholdCrossed bool
	EventType        string
	SeverityFactor   float64
	PolledAt         time.Time
}

type FetchConfig struct {
	BaseURL     string
	Latitude    float64
	Longitude   float64
	PollingZone string
}

func WeatherCodeSummary(code int) string {
	switch {
	case code == 0:
		return "Clear"
	case code >= 1 && code <= 3:
		return "Partly Cloudy"
	case code >= 51 && code <= 67:
		return "Rain"
	case code >= 71 && code <= 77:
		return "Snow"
	case code >= 80 && code <= 82:
		return "Rain Showers"
	case code >= 95 && code <= 99:
		return "Thunderstorm"
	default:
		return "Unknown"
	}
}

func FetchWeatherSignal(ctx context.Context, httpClient *http.Client, cfg FetchConfig) (SignalReading, error) {
	reqURL, err := url.Parse(cfg.BaseURL)
	if err != nil {
		return SignalReading{}, fmt.Errorf("invalid base URL: %w", err)
	}

	q := reqURL.Query()
	q.Set("latitude", fmt.Sprintf("%f", cfg.Latitude))
	q.Set("longitude", fmt.Sprintf("%f", cfg.Longitude))
	q.Set("current", "precipitation,rain,weathercode,windspeed_10m")
	q.Set("timezone", "auto")
	q.Set("forecast_days", "1")
	reqURL.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL.String(), nil)
	if err != nil {
		return SignalReading{}, fmt.Errorf("create request failed: %w", err)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return SignalReading{}, fmt.Errorf("fetch weather failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return SignalReading{}, fmt.Errorf("open-meteo returned status %d", resp.StatusCode)
	}

	var omResp OpenMeteoResponse
	if err := json.NewDecoder(resp.Body).Decode(&omResp); err != nil {
		return SignalReading{}, fmt.Errorf("decode weather response failed: %w", err)
	}

	reading := SignalReading{
		Zone:             cfg.PollingZone,
		Latitude:         omResp.Latitude,
		Longitude:        omResp.Longitude,
		PrecipitationMM:  omResp.Current.Precipitation,
		RainMM:           omResp.Current.Rain,
		WindSpeedKMH:     omResp.Current.Windspeed10m,
		WeatherCode:      omResp.Current.Weathercode,
		WeatherSummary:   WeatherCodeSummary(omResp.Current.Weathercode),
		PolledAt:         time.Now().UTC(),
		ThresholdCrossed: false,
		EventType:        "normal",
		SeverityFactor:   0.0,
	}

	if reading.PrecipitationMM > 15.0 {
		reading.ThresholdCrossed = true
		reading.EventType = "heavy_rain"
		reading.SeverityFactor = 1.0
	} else if reading.WindSpeedKMH > 40.0 {
		reading.ThresholdCrossed = true
		reading.EventType = "severe_wind"
		reading.SeverityFactor = 0.5
	}

	return reading, nil
}
