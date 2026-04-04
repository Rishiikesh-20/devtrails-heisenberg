import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { mockHealthData } from './mockTriggersData';

export const SourceHealthPanel = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      {mockHealthData.map((node) => (
        <div key={node.source} className="glass-card p-4 rounded-xl border border-white/10 bg-white/4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-300">{node.source}</span>
            {node.status === 'Healthy' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
             node.status === 'Degraded' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
             <XCircle className="w-4 h-4 text-red-400" />}
          </div>

          <div>
            <div className="flex items-end gap-1 mb-1">
              <span className={`text-2xl font-semibold tracking-tight ${
                node.status === 'Healthy' ? 'text-white' :
                node.status === 'Degraded' ? 'text-amber-100' : 'text-red-100'
              }`}>
                {node.latencyMs}
              </span>
              <span className="text-xs text-gray-500 mb-1">ms ping</span>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${node.status === 'Healthy' ? 'bg-emerald-500' : node.status === 'Degraded' ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${node.uptime}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{node.uptime}% Uptime</p>
          </div>
        </div>
      ))}
    </div>
  );
};
