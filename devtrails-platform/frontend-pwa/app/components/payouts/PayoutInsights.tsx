import React from 'react';
import { Clock, RefreshCcw, Building2 } from 'lucide-react';

export const PayoutInsights = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Processing SLA */}
        <div className="premium-card p-5 border-teal-100 ring-1 ring-teal-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-500" /> Processing SLA
            </h3>
            <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-200">
              Stable
            </span>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">
            41 <span className="text-sm font-semibold text-gray-500">secs</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">Avg time from trigger to payout</p>
        </div>

        {/* Recovery Rate */}
        <div className="premium-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-amber-500" /> Recovery Rate
            </h3>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">99.8%</p>
          <p className="text-xs text-gray-600 mt-1">Automated retry success on failures</p>
        </div>

        {/* Payment Rail Status */}
        <div className="premium-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-electric" /> Rail Health
            </h3>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
            </span>
          </div>
          <div className="space-y-2.5 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">UPI / IMPS</span>
              <span className="text-xs font-bold text-teal-600">Operational</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-100 pt-2">
              <span className="text-sm font-medium text-gray-700">Wallets</span>
              <span className="text-xs font-bold text-teal-600">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
