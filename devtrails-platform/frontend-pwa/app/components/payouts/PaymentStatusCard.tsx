import React from 'react';
import { CreditCard, ArrowUpRight, Zap, Building2, Wallet } from 'lucide-react';
import { PayoutRecord } from './types';
import { PayoutStatusTimeline } from './PayoutStatusTimeline';

interface PaymentStatusCardProps {
  payout: PayoutRecord;
  isLatest?: boolean;
}

export const PaymentStatusCard = ({ payout, isLatest = false }: PaymentStatusCardProps) => {
  const statusColors = {
    Initiated: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    Processing: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Failed: 'text-red-400 bg-red-500/10 border-red-500/20'
  };

  const getMethodIcon = (method: string) => {
    if (method.toLowerCase().includes('bank') || method.toLowerCase().includes('wire')) return <Building2 className="w-5 h-5" />;
    if (method.toLowerCase().includes('wallet')) return <Wallet className="w-5 h-5" />;
    return <CreditCard className="w-5 h-5" />;
  };

  return (
    <div className={`p-6 rounded-2xl glass-card transition-all duration-300 ${
      isLatest
        ? 'border-indigo-500/40 bg-indigo-950/20 shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)] ring-1 ring-inset ring-indigo-500/20'
        : 'border-white/10 bg-white/4 hover:bg-white/5'
    }`}>

      {isLatest && (
        <div className="mb-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 fill-indigo-400" />
          Active Disbursement
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isLatest ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-white/5 border-white/10 text-gray-400'
            }`}>
              {getMethodIcon(payout.method)}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">Reference ID</p>
              <p className="text-gray-200 font-mono text-sm">{payout.id}</p>
            </div>
          </div>

          <div className="pl-14">
            <p className="text-sm text-gray-400 font-medium">{payout.method}</p>
            <p className="text-xs text-gray-500 mt-0.5">{payout.destination}</p>
          </div>
        </div>

        <div className="md:text-right flex flex-col items-start md:items-end">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl font-semibold tracking-tight text-white">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: payout.currency }).format(payout.amount)}
            </span>
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          </div>

          <div className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold tracking-wide border ${statusColors[payout.status]}`}>
            {payout.status}
          </div>

          <p className="text-xs text-gray-500 mt-3 font-medium">
            Initiated: {new Date(payout.initiatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-white/10 border-dashed">
        <PayoutStatusTimeline
          status={payout.status}
          initiatedAt={payout.initiatedAt}
          completedAt={payout.completedAt}
        />
      </div>
    </div>
  );
};
