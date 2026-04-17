import React from 'react';
import { CreditCard, ArrowUpRight, Zap, Building2, Wallet } from 'lucide-react';
import { PayoutRecord } from './types';
import { PayoutStatusTimeline } from './PayoutStatusTimeline';

interface PaymentStatusCardProps {
  payout: PayoutRecord;
  isLatest?: boolean;
}

const statusStyles = {
  Initiated: 'text-blue-700 bg-blue-50 border-blue-200',
  Processing: 'text-amber-700 bg-amber-50 border-amber-200',
  Completed: 'text-teal-700 bg-teal-50 border-teal-200',
  Failed: 'text-red-700 bg-red-50 border-red-200',
};

const getMethodIcon = (method: string) => {
  if (method.toLowerCase().includes('bank') || method.toLowerCase().includes('wire'))
    return <Building2 className="w-5 h-5" />;
  if (method.toLowerCase().includes('wallet'))
    return <Wallet className="w-5 h-5" />;
  return <CreditCard className="w-5 h-5" />;
};

export const PaymentStatusCard = ({ payout, isLatest = false }: PaymentStatusCardProps) => {
  const statusStyle = statusStyles[payout.status] ?? statusStyles.Processing;

  return (
    <div className={`premium-card p-6 transition-all duration-300 ${
      isLatest ? 'ring-2 ring-electric/20 border-electric/30' : ''
    }`}>

      {isLatest && (
        <div className="mb-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-electric/8 border border-electric/20 text-electric text-xs font-bold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" />
          Active Disbursement
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isLatest ? 'bg-electric/8 border-electric/20 text-electric' : 'bg-gray-100 border-gray-200 text-gray-600'
            }`}>
              {getMethodIcon(payout.method)}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Reference ID</p>
              <p className="text-gray-900 font-mono font-semibold text-sm">{payout.id}</p>
            </div>
          </div>

          <div className="pl-14">
            <p className="text-sm text-gray-800 font-semibold">{payout.method}</p>
            <p className="text-xs text-gray-500 mt-0.5">{payout.destination}</p>
          </div>
        </div>

        <div className="md:text-right flex flex-col items-start md:items-end">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl font-extrabold tracking-tight text-gray-900">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: payout.currency }).format(payout.amount)}
            </span>
            <ArrowUpRight className="w-5 h-5 text-teal-500" />
          </div>

          <div className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold tracking-wide border ${statusStyle}`}>
            {payout.status}
          </div>

          <p className="text-xs text-gray-500 mt-3 font-medium">
            Initiated: {new Date(payout.initiatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="pt-5 border-t border-dashed border-gray-200">
        <PayoutStatusTimeline
          status={payout.status}
          initiatedAt={payout.initiatedAt}
          completedAt={payout.completedAt}
        />
      </div>
    </div>
  );
};
