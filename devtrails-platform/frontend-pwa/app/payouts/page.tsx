import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Landmark, History } from 'lucide-react';
import { PaymentStatusCard } from '../components/payouts/PaymentStatusCard';
import { mockPayouts } from '../components/payouts/mockPayoutData';
import { PayoutInsights } from '../components/payouts/PayoutInsights';

export default function PayoutsPage() {
  const latestPayout = mockPayouts[0];
  const historicalPayouts = mockPayouts.slice(1);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-12">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>

            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <Landmark className="w-7 h-7 text-indigo-400" />
                </div>
                Payout Center
              </h1>
              <p className="text-gray-400 text-lg">
                Track your parametric claim disbursements and historical transfers.
              </p>
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <PaymentStatusCard payout={latestPayout} isLatest={true} />
        </section>

        <section>
          <PayoutInsights />
        </section>

        <section className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" />
              Historical Transfers
            </h2>
            <span className="text-sm font-medium text-gray-500 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              {historicalPayouts.length} past records
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {historicalPayouts.map(payout => (
              <PaymentStatusCard key={payout.id} payout={payout} isLatest={false} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
