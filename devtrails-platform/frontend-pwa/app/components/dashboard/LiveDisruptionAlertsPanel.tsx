import React from 'react';
import { AlertCircle, ArrowUpRight, Activity } from 'lucide-react';

interface DisruptionAlert {
  id: string;
  type: string;
  location: string;
  severity: 'Critical' | 'High' | 'Elevated';
  time: string;
  linkedClaim?: string;
}

export const LiveDisruptionAlertsPanel = ({ onAlertClick }: { onAlertClick: (alert: DisruptionAlert) => void }) => {
  const alerts: DisruptionAlert[] = [
    {
      id: 'ALR-001',
      type: 'Flash Flood Route Block',
      location: 'Yamuna River Delta, Delhi',
      severity: 'Critical',
      time: '2 mins ago',
      linkedClaim: 'CLM-009A'
    },
    {
      id: 'ALR-002',
      type: 'Traffic Gridlock (Unrest)',
      location: 'Hauz Khas, South Delhi',
      severity: 'High',
      time: '15 mins ago',
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10 bg-white/4">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold tracking-wider text-gray-300 uppercase flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
          Live Disruption Intel
        </h3>
        <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
          2 Active
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map(alert => (
          <div
            key={alert.id}
            onClick={() => onAlertClick(alert)}
            className="p-3 bg-white/5 border border-white/5 rounded-xl hover:border-indigo-500/30 hover:bg-indigo-500/10 cursor-pointer transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-gray-200 group-hover:text-indigo-300 transition-colors">
                  {alert.type}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{alert.location}</p>
              </div>
              {alert.linkedClaim ? (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-px rounded">
                    Claim Matching
                  </span>
                  <span className="text-xs text-indigo-400 font-mono flex items-center gap-0.5">
                    {alert.linkedClaim} <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              ) : (
                <AlertCircle className={`w-4 h-4 ${
                  alert.severity === 'Critical' ? 'text-red-500' : 'text-amber-500'
                }`} />
              )}
            </div>

            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/5">
               <span className="text-xs text-gray-500 font-medium">{alert.time}</span>
               <div className="w-1 h-1 bg-gray-600 rounded-full" />
               <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{alert.severity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
