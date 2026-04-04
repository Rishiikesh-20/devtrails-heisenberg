'use client';

import React, { useState, useCallback } from 'react';
import { Activity, Radio, PlayCircle } from 'lucide-react';
import { SignalSource, TriggerEvent } from '../components/triggers/types';
import { initialTriggerEvents, generateMockEvent } from '../components/triggers/mockTriggersData';
import { SignalSourceTabs } from '../components/triggers/SignalSourceTabs';
import { LiveEventFeedTable } from '../components/triggers/LiveEventFeedTable';
import { EvidenceDrawer } from '../components/triggers/EvidenceDrawer';
import { SourceHealthPanel } from '../components/triggers/SourceHealthPanel';

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
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header & Controls */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <Radio className="w-7 h-7 text-indigo-400" />
              </div>
              Parametric Signal Hub
            </h1>
            <p className="text-gray-400 text-lg">
              Live telemetry and automated contract trigger evaluation.
            </p>
          </div>

          <button
            onClick={simulateRealtimeEvent}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            <PlayCircle className="w-5 h-5" />
            Inject Test Signal
          </button>
        </header>

        {/* Health Monitors */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">
             <Activity className="w-4 h-4 text-emerald-500" />
             Oracle Connectors Health
          </div>
          <SourceHealthPanel />
        </section>

        {/* Live Feed */}
        <section className="mt-8">
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
    </div>
  );
}
