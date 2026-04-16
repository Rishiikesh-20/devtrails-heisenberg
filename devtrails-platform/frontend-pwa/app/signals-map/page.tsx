'use client';

import React, { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { MapViewer } from '../components/map/MapViewer';
import { ZoneImpactLegend } from '../components/map/ZoneImpactLegend';
import { SourceHealthPanel } from '../components/triggers/SourceHealthPanel';
import { PageShell } from '../components/ui/PageShell';

export default function SignalsMapPage() {
  const [query, setQuery] = useState('');

  return (
    <PageShell>
      {/* Full-height layout below the PageShell header */}
      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>

        {/* Page header bar */}
        <div className="flex-none px-5 py-4 bg-white border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-electric/10 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-electric" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric">Oracle Engine</p>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Geospatial Signals Map</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search affected region..."
              className="bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 w-full"
            />
          </div>
        </div>

        {/* Map container — takes remaining space */}
        <div className="flex-1 relative overflow-hidden">
          <MapViewer />
          <ZoneImpactLegend />
        </div>

        {/* Bottom health panel */}
        <div className="flex-none px-5 py-3 bg-white border-t border-gray-200 hidden md:block">
          <SourceHealthPanel />
        </div>
      </div>
    </PageShell>
  );
}
