'use client';
import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { MetricsCards, ClaimHeatmap, FraudTrendChart, RiskForecastPanel } from '../components/admin/AdminWidgets';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <ShieldCheck className="w-7 h-7 text-indigo-400" />
              </div>
              Insurer Command Center
            </h1>
            <p className="text-gray-400 text-lg mt-2">
              Macro portfolio risk and global parametric engine oversight.
            </p>
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
          <div>
             <RiskForecastPanel />
          </div>
        </section>
      </div>
    </div>
  );
}
