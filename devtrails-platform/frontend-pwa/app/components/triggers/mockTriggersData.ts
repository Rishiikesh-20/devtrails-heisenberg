import { SourceHealth, TriggerEvent } from './types';

export const mockHealthData: SourceHealth[] = [
  { source: 'Weather', status: 'Healthy', latencyMs: 42, uptime: 99.99, lastChecked: new Date().toISOString() },
  { source: 'Social', status: 'Degraded', latencyMs: 312, uptime: 98.45, lastChecked: new Date().toISOString() },
  { source: 'Traffic', status: 'Healthy', latencyMs: 65, uptime: 99.9, lastChecked: new Date().toISOString() },
  { source: 'Routing', status: 'Healthy', latencyMs: 88, uptime: 99.5, lastChecked: new Date().toISOString() },
  { source: 'Places', status: 'Healthy', latencyMs: 50, uptime: 99.95, lastChecked: new Date().toISOString() },
];

export const initialTriggerEvents: TriggerEvent[] = [
  {
    id: 'TRG-WTH-8812',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    source: 'Weather',
    title: 'Severe Flash Flood Warning',
    location: 'South Delhi',
    severity: 'Critical',
    status: 'Processed',
    evidence: {
      rawPayload: '{"alert_type":"Flash Flood","severity":"Extreme","polygon":"..."}',
      confidenceScore: 0.98,
      provider: 'NOAA API',
      metadata: { precipitation_rate: '4.5in/hr', affected_radius: '15mi' }
    }
  },
  {
    id: 'TRG-SOC-9931',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    source: 'Social',
    title: 'High Spike: Riot Mentions',
    location: 'Koramangala, Bengaluru',
    severity: 'High',
    status: 'Pending',
    evidence: {
      rawPayload: '{"gdelt_theme":"Civil Unrest","tone":-7.4,"volume_intensity":450}',
      confidenceScore: 0.82,
      provider: 'GDELT Project',
      metadata: { event_code: '14Z', localized_escalation: true }
    }
  },
  {
    id: 'TRG-TRF-0021',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    source: 'Traffic',
    title: 'Highway 101 Complete Gridlock',
    location: 'Andheri, Mumbai',
    severity: 'Medium',
    status: 'Ignored',
    evidence: {
      rawPayload: '{"segment_id":"HWY101_LA","speed_avg":4,"duration_mins":120}',
      confidenceScore: 0.95,
      provider: 'TomTom Traffic',
      metadata: { cause: 'Accident/Construction multi-lane closure' }
    }
  }
];

export const generateMockEvent = (): TriggerEvent => {
  const sources: ('Weather' | 'Social' | 'Traffic' | 'Routing' | 'Places')[] = ['Weather', 'Social', 'Traffic', 'Routing', 'Places'];
  const severities: ('Low' | 'Medium' | 'High' | 'Critical')[] = ['Low', 'Medium', 'High', 'Critical'];
  const locations = ['South Delhi', 'HSR Layout, Bengaluru', 'Andheri, Mumbai', 'HITEC City, Hyderabad', 'T Nagar, Chennai', 'Coimbatore'];

  const source = sources[Math.floor(Math.random() * sources.length)];
  return {
    id: `TRG-SIM-${Math.floor(Math.random() * 10000)}`,
    timestamp: new Date().toISOString(),
    source,
    title: `Simulated ${source} Anomaly Detected`,
    location: locations[Math.floor(Math.random() * locations.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    status: 'Pending',
    evidence: {
      rawPayload: `{"simulated":true,"source":"${source}","val":${Math.random()}}`,
      confidenceScore: 0.7 + (Math.random() * 0.25),
      provider: 'DevTrails Simulator',
      metadata: { test_run: true, generated_at: Date.now() }
    }
  };
};
