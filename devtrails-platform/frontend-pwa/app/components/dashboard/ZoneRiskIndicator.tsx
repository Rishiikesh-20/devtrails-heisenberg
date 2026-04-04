import React from 'react';
import { ShieldAlert, Crosshair } from 'lucide-react';

export const ZoneRiskIndicator = () => {
  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10 bg-white/4 flex justify-between items-center sm:flex-col sm:items-start lg:flex-row lg:items-center">
      <div className="space-y-2">
         <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 flex items-center gap-1.5 mb-1">
           <Crosshair className="w-3 h-3 text-indigo-400" />
           Your Active Zone Risk
         </h3>
         <p className="text-3xl font-extrabold tracking-tight text-white flex gap-2 items-baseline">
           24<span className="text-sm font-medium text-amber-500 uppercase tracking-wider">Elevated</span>
         </p>
         <p className="text-xs text-gray-400">Risk increased +15% past hour due to weather.</p>
      </div>

      <div className="w-16 h-16 rounded-full border-[6px] border-amber-500/20 flex items-center justify-center relative mt-4 sm:mt-0 lg:mt-0">
        <svg viewBox="0 0 36 36" className="absolute top-0 left-0 w-full h-full -rotate-90">
          <path
            className="text-amber-500"
            style={{ strokeDasharray: '100, 100', strokeDashoffset: '76' }}
            stroke="currentColor"
            strokeWidth="3.5"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <ShieldAlert className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
      </div>
    </div>
  );
};
