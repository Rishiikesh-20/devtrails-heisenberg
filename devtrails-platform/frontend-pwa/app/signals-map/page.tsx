'use client';

import React from 'react';
import { Map, MapPin, Search } from 'lucide-react';
import { MapViewer } from '../components/map/MapViewer';
import { ZoneImpactLegend } from '../components/map/ZoneImpactLegend';
import { SourceHealthPanel } from '../components/triggers/SourceHealthPanel';

export default function SignalsMapPage() {
  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col pt-16 md:pt-0 font-sans lg:overflow-hidden relative">
      <div className="flex-none p-6 md:p-8 pb-4 border-b border-white/5 flex flex-col md:flex-row md:items-end justify-between gap-4 z-10 bg-gray-950">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Map className="w-7 h-7 text-indigo-400" />
            </div>
            Geospatial Signals Map
          </h1>
          <p className="text-gray-400 text-sm mt-2 max-w-2xl">
            Live OpenStreetMap validation overlay showing Route Congestion paths, isolated Impact Zones, and Place Markers.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 w-full md:w-64 max-w-sm">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search affected region..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full"
          />
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 relative p-4 md:p-8 pt-4 pb-4 overflow-hidden h-[calc(100vh-200px)] z-0">
        <MapViewer />
        <ZoneImpactLegend />
      </div>

      <div className="flex-none px-8 pb-6 hidden md:block">
         <SourceHealthPanel />
      </div>
    </div>
  );
}
