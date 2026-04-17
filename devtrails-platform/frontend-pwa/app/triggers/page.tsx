'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Radio, PlayCircle, RefreshCw } from 'lucide-react';
import { SignalSource, TriggerEvent, Severity } from '../components/triggers/types';
import { SignalSourceTabs } from '../components/triggers/SignalSourceTabs';
import { LiveEventFeedTable } from '../components/triggers/LiveEventFeedTable';
import { EvidenceDrawer } from '../components/triggers/EvidenceDrawer';
import { SourceHealthPanel } from '../components/triggers/SourceHealthPanel';
import { PageShell } from '../components/ui/PageShell';
import { useToast } from '../components/ui/ToastProvider';
import { apiGet, apiPost, getUser } from '../lib/api';
import { getZoneByValue } from '../lib/constants';
import type { RegisterResponse } from '../lib/types';

type WeatherSignal = {
  id: string;
  zone: string;
  event_type: string;
  severity_factor?: number;
  threshold_crossed: boolean;
  precipitation_mm?: number;
  wind_speed_kmh?: number;
  temperature_c?: number;
  weather_summary?: string;
  polled_at: string;
};

type WeatherListResponse = {
  data: WeatherSignal[];
  count: number;
};

const SIMULATION_EVENTS = [
  { event_type: 'heavy_rain', severity_factor: 1.0 },
  { event_type: 'platform_outage', severity_factor: 1.0 },
  { event_type: 'traffic_disruption', severity_factor: 0.5 },
  { event_type: 'curfew', severity_factor: 1.2 },
  { event_type: 'fuel_shortage', severity_factor: 0.65 },
];

function humanize(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toSeverity(signal: WeatherSignal): Severity {
  const factor = signal.severity_factor ?? 0;
  if (factor >= 1.2) return 'Critical';
  if (factor >= 1.0) return 'High';
  if (factor >= 0.7) return 'Medium';
  if (signal.threshold_crossed) return 'High';
  return 'Low';
}

function mapSignalToTriggerEvent(signal: WeatherSignal): TriggerEvent {
  const zone = getZoneByValue(signal.zone);
  return {
    id: signal.id,
    timestamp: signal.polled_at,
    source: 'Weather',
    title: signal.weather_summary?.trim() || humanize(signal.event_type),
    location: zone.label,
    severity: toSeverity(signal),
    status: signal.threshold_crossed ? 'Processed' : 'Pending',
    evidence: {
      rawPayload: JSON.stringify(signal),
      confidenceScore: signal.threshold_crossed ? 0.92 : 0.68,
      provider: 'Open-Meteo Oracle Poller',
      metadata: {
        zone: zone.value,
        event_type: signal.event_type,
        precipitation_mm: signal.precipitation_mm ?? 0,
        wind_speed_kmh: signal.wind_speed_kmh ?? 0,
        temperature_c: signal.temperature_c ?? 0,
      },
    },
  };
}

export default function TriggersDashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [events, setEvents] = useState<TriggerEvent[]>([]);
  const [activeSource, setActiveSource] = useState<SignalSource>('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TriggerEvent | null>(null);
  const [user, setUser] = useState<RegisterResponse | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [injecting, setInjecting] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getUser());
      setSessionResolved(true);
    });
  }, []);

  const fetchEvents = useCallback(
    async (signal?: AbortSignal) => {
      if (!user) {
        return;
      }

      setLoading(true);
      try {
        const path = `/api/v1/weather?zone=${encodeURIComponent(user.zone)}&limit=50`;
        const res = await apiGet<WeatherListResponse>(path, signal);
        setEvents((res.data ?? []).map(mapSignalToTriggerEvent));
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Unable to load signals.', 'error');
      } finally {
        setLoading(false);
      }
    },
    [addToast, user],
  );

  useEffect(() => {
    if (!sessionResolved) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void fetchEvents(controller.signal);
      }
    });
    return () => controller.abort();
  }, [fetchEvents, router, sessionResolved, user]);

  const filteredEvents = activeSource === 'All'
    ? events
    : events.filter(evt => evt.source === activeSource);

  const simulateRealtimeEvent = useCallback(() => {
    if (!user || injecting) {
      return;
    }

    const selected = SIMULATION_EVENTS[Math.floor(Math.random() * SIMULATION_EVENTS.length)];
    setInjecting(true);
    void apiPost('/api/v1/simulate-event', {
      event_type: selected.event_type,
      zone_id: user.zone,
      severity_factor: selected.severity_factor,
    })
      .then(() => {
        addToast('Test signal injected and processed.', 'success');
        return fetchEvents();
      })
      .catch((err) => {
        addToast(err instanceof Error ? err.message : 'Failed to inject signal.', 'error');
      })
      .finally(() => {
        setInjecting(false);
      });
  }, [addToast, fetchEvents, injecting, user]);

  const handleRowSelect = (evt: TriggerEvent) => {
    setSelectedEvent(evt);
    setDrawerOpen(true);
  };

  if (!sessionResolved) return null;
  if (!user) return null;

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-8">

        {/* Header & Controls */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric">
              Oracle Engine
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric/8 flex items-center justify-center">
                <Radio className="w-5 h-5 text-electric" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Parametric Signal Hub
                </h1>
                <p className="text-sm text-gray-600">
                  Live telemetry for {getZoneByValue(user.zone).label} and automated trigger evaluation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchEvents()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={simulateRealtimeEvent}
              disabled={injecting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-electric hover:bg-electric-600 text-white rounded-xl font-semibold text-sm shadow-sm shadow-electric/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <PlayCircle className="w-4 h-4" />
              {injecting ? 'Injecting...' : 'Inject Test Signal'}
            </button>
          </div>
        </header>

        {/* Health Monitors */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-700 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-teal-500" />
            Oracle Connectors Health
          </div>
          <SourceHealthPanel />
        </section>

        {/* Live Feed */}
        <section className="space-y-4">
          <SignalSourceTabs
            activeSource={activeSource}
            onSourceChange={setActiveSource}
          />

          <LiveEventFeedTable
            events={filteredEvents}
            onSelectEvent={handleRowSelect}
          />
        </section>

      </div>

      {/* Drawer */}
      <EvidenceDrawer
        isOpen={drawerOpen}
        event={selectedEvent}
        onClose={() => setDrawerOpen(false)}
      />
    </PageShell>
  );
}
