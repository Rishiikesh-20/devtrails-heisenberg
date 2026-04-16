'use client';
import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { MetricsCards, ClaimHeatmap, FraudTrendChart, RiskForecastPanel, ReinsuranceStatusWidget } from '../components/admin/AdminWidgets';
import { PageShell } from '../components/ui/PageShell';

export default function AdminDashboardPage() {
  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-8">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric">
              Insurer View
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-electric" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Insurer Command Center
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Macro portfolio risk and global parametric engine oversight.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-xs font-semibold text-teal-700">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            Live Portfolio Feed
          </div>
        </header>

        <section>
          <MetricsCards />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ClaimHeatmap />
            <FraudTrendChart />
          </div>
          <div className="space-y-6">
            <ReinsuranceStatusWidget />
            <RiskForecastPanel />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
