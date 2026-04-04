import React from 'react';
import { Clock, ShieldAlert, RefreshCcw, Activity, Building2 } from 'lucide-react';

export const PayoutInsights = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SLA Clock */}
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" /> Processing SLA
            </h3>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">Stable</span>
          </div>
          <p className="text-2xl font-bold text-white">41 <span className="text-sm text-gray-400">secs</span></p>
          <p className="text-xs text-gray-500 mt-1">Avg time from trigger to payout</p>
        </div>

        {/* Failure Recovery */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 bg-white/4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-amber-400" /> Recovery Rate
            </h3>
          </div>
          <p className="text-2xl font-bold text-white">99.8%</p>
          <p className="text-xs text-gray-500 mt-1">Automated retry success on failures</p>
        </div>

        {/* Payment Rail Status */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 bg-white/4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" /> Rail Health
            </h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center"><span className="text-xs text-gray-400">UPI / IMPS</span><span className="text-xs font-mono text-emerald-400">Operational</span></div>
            <div className="flex justify-between items-center"><span className="text-xs text-gray-400">Wallets</span><span className="text-xs font-mono text-emerald-400">Operational</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
