export type SignalSource = 'All' | 'Weather' | 'Social' | 'Traffic' | 'Routing' | 'Places';
export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
export type EventStatus = 'Pending' | 'Processed' | 'Ignored';

export interface EvidenceData {
  rawPayload: string;
  confidenceScore: number;
  provider: string;
  metadata: Record<string, any>;
}

export interface TriggerEvent {
  id: string;
  timestamp: string;
  source: SignalSource;
  title: string;
  location: string;
  severity: Severity;
  status: EventStatus;
  evidence: EvidenceData;
}

export interface SourceHealth {
  source: SignalSource;
  status: 'Healthy' | 'Degraded' | 'Down';
  latencyMs: number;
  uptime: number;
  lastChecked: string;
}
