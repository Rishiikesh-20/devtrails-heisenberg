import React from 'react';
import Link from 'next/link';
import { Landmark, History } from 'lucide-react';
import { PageShell } from '../components/ui/PageShell';
import { PaymentStatusCard } from '../components/payouts/PaymentStatusCard';
import { mockPayouts } from '../components/payouts/mockPayoutData';
import { PayoutInsights } from '../components/payouts/PayoutInsights';

export default function PayoutsPage() {
  const latestPayout = mockPayouts[0];
  const historicalPayouts = mockPayouts.slice(1);

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-10">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric">
              Parametric Payouts
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric/8 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-electric" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payout Center</h1>
                <p className="text-sm text-gray-600">
                  Track your parametric disbursements and historical transfers.
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-electric hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </header>

        <section className="space-y-6">
          <PaymentStatusCard payout={latestPayout} isLatest={true} />
        </section>

        <section>
          <PayoutInsights />
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" />
              Historical Transfers
            </h2>
            <span className="text-sm font-medium text-gray-500 px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
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
    </PageShell>
  );
}
