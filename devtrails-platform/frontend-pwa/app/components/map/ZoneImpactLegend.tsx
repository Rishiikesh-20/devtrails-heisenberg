import React from 'react';
import { ShieldAlert, Navigation, AlertTriangle } from 'lucide-react';

export const ZoneImpactLegend = () => {
  return (
    <div className="absolute bottom-6 right-6 z-[1000] glass-card p-4 rounded-xl border border-white/10 bg-gray-950/80 backdrop-blur-md shadow-2xl">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Live Signal Legend</h4>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/50 flex items-center justify-center">
            <ShieldAlert size={10} className="text-red-400" />
          </div>
          <span className="text-sm font-medium text-gray-200">Critical Impact Zone</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
             <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
             <div className="w-1.5 h-1.5 bg-amber-500 rounded-full opacity-50" />
             <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
          </div>
          <span className="text-sm font-medium text-gray-200">Route Congestion Overlay</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
            <div className="w-3 h-3 bg-red-600 rounded-full absolute top-0 left-0"></div>
          </div>
          <span className="text-sm font-medium text-gray-200">Active Place Marker</span>
        </div>
      </div>
    </div>
  );
};
