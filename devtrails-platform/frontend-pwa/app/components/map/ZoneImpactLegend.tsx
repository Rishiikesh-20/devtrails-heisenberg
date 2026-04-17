import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const ZoneImpactLegend = () => {
  return (
    <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-md border border-gray-200 p-4 rounded-xl shadow-lg">
      <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Live Signal Legend</h4>
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-red-100 border border-red-300 flex items-center justify-center shrink-0">
            <ShieldAlert size={11} className="text-red-600" />
          </div>
          <span className="text-xs font-semibold text-gray-700">Critical Impact Zone</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-0.5 items-center">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full opacity-60" />
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
          </div>
          <span className="text-xs font-semibold text-gray-700">Route Congestion Overlay</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-5 h-5 flex items-center justify-center">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping opacity-60 absolute" />
            <div className="w-3 h-3 bg-red-600 rounded-full relative" />
          </div>
          <span className="text-xs font-semibold text-gray-700">Active Place Marker</span>
        </div>
      </div>
    </div>
  );
};
