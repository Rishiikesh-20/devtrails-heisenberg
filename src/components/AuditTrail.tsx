"use client";

import React from "react";
import { FileText } from "lucide-react";

const MOCK_PAYOUTS = [
  {
    id: 1,
    amount: "₹622",
    date: "Mar 14",
    trigger: "Gov. Section 144 Curfew",
    source: "Verified API Feed",
  },
  {
    id: 2,
    amount: "₹305",
    date: "Mar 10",
    trigger: "Rainfall > 22mm/hr",
    source: "IMD Weather API",
  },
];

export default function AuditTrail() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
        <FileText size={16} className="text-zinc-500" />
        <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
          On-Chain Audit Trail &amp; History
        </h3>
      </div>

      {/* Payout rows */}
      <div className="divide-y divide-white/[0.04]">
        {MOCK_PAYOUTS.map((payout) => (
          <div
            key={payout.id}
            className="px-5 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="mono text-base font-bold text-white tracking-tight">
                Payout: {payout.amount}
              </span>
              <span className="mono text-xs text-zinc-500">{payout.date}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-600 text-xs">Trigger:</span>
                <span className="text-zinc-300 text-xs font-medium">
                  {payout.trigger}
                </span>
              </div>
              <span className="hidden sm:inline text-zinc-700">·</span>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-600 text-xs">Data Source:</span>
                <span className="mono text-xs text-zinc-400">
                  {payout.source}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer decorative bar */}
      <div className="px-5 py-2.5 bg-white/[0.02] border-t border-white/[0.04]">
        <span className="mono text-[10px] text-zinc-600 uppercase tracking-widest">
          IPFS-anchored · Immutable record · Block #48291
        </span>
      </div>
    </div>
  );
}
