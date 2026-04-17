import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { mockHealthData } from './mockTriggersData';

export const SourceHealthPanel = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {mockHealthData.map((node) => {
        const isHealthy = node.status === 'Healthy';
        const isDegraded = node.status === 'Degraded';
        const statusBg = isHealthy ? 'bg-teal-50 border-teal-100' : isDegraded ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100';
        const barColor = isHealthy ? 'bg-teal-500' : isDegraded ? 'bg-amber-500' : 'bg-red-500';

        return (
          <div key={node.source} className={`premium-card p-4 border rounded-xl ${statusBg}`}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-gray-800">{node.source}</span>
              {isHealthy
                ? <CheckCircle2 className="w-4 h-4 text-teal-500" />
                : isDegraded
                  ? <AlertTriangle className="w-4 h-4 text-amber-500" />
                  : <XCircle className="w-4 h-4 text-red-500" />}
            </div>

            <div className="flex items-end gap-1 mb-2">
              <span className={`text-2xl font-bold tracking-tight text-gray-900`}>
                {node.latencyMs}
              </span>
              <span className="text-xs text-gray-500 mb-1">ms</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${barColor} transition-all`}
                style={{ width: `${node.uptime}%` }}
              />
            </div>
            <p className="text-[10px] font-semibold text-gray-500 mt-1.5 uppercase tracking-wider">
              {node.uptime}% uptime
            </p>
          </div>
        );
      })}
    </div>
  );
};
