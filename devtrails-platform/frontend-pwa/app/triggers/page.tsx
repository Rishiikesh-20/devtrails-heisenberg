'use client';

import React, { useState, useCallback } from 'react';
import { Activity, Radio, PlayCircle } from 'lucide-react';
import { SignalSource, TriggerEvent } from '../components/triggers/types';
import { initialTriggerEvents, generateMockEvent } from '../components/triggers/mockTriggersData';
import { SignalSourceTabs } from '../components/triggers/SignalSourceTabs';
import { LiveEventFeedTable } from '../components/triggers/LiveEventFeedTable';
import { EvidenceDrawer } from '../components/triggers/EvidenceDrawer';
import { SourceHealthPanel } from '../components/triggers/SourceHealthPanel';
import { PageShell } from '../components/ui/PageShell';

export default function TriggersDashboardPage() {
  const [events, setEvents] = useState<TriggerEvent[]>(initialTriggerEvents);
  const [activeSource, setActiveSource] = useState<SignalSource>('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TriggerEvent | null>(null);

  const filteredEvents = activeSource === 'All'
    ? events
    : events.filter(evt => evt.source === activeSource);

  const simulateRealtimeEvent = useCallback(() => {
    const newEvent = generateMockEvent();
    setEvents(prev => [newEvent, ...prev]);
  }, []);

  const handleRowSelect = (evt: TriggerEvent) => {
    setSelectedEvent(evt);
    setDrawerOpen(true);
  };

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
                  Live telemetry and automated contract trigger evaluation.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={simulateRealtimeEvent}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-electric hover:bg-electric-600 text-white rounded-xl font-semibold text-sm shadow-sm shadow-electric/20 transition-all active:scale-[0.98]"
          >
            <PlayCircle className="w-4 h-4" />
            Inject Test Signal
          </button>
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
