"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Clock3, FileText } from "lucide-react";

import type { PayoutListItem } from "@/lib/devtrailsApi";

type AuditTrailProps = {
  payouts: PayoutListItem[];
  loading?: boolean;
};

function formatCreatedAt(isoTime: string): { date: string; time: string } {
  const parsed = new Date(isoTime);
  if (Number.isNaN(parsed.getTime())) {
    return { date: "--", time: "--" };
  }

  return {
    date: parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    time: parsed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}

function shortEvent(eventID: string): string {
  return eventID.length > 12 ? `${eventID.slice(0, 12)}...` : eventID;
}

export default function AuditTrail({ payouts, loading = false }: AuditTrailProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/6 flex items-center gap-2.5">
        <FileText size={16} className="text-zinc-500" />
        <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
          On-Chain Audit Trail &amp; History
        </h3>
      </div>

      {/* Payout rows */}
      <div className="divide-y divide-white/4">
        {loading ? (
          <div className="px-5 py-4 space-y-3">
            <div className="h-4 w-full rounded bg-white/6" />
            <div className="h-4 w-3/4 rounded bg-white/6" />
            <div className="h-4 w-2/3 rounded bg-white/6" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="px-5 py-6 text-sm text-zinc-500">
            No payout transactions yet. Trigger a live disruption to populate history.
          </div>
        ) : (
          payouts.map((payout) => {
            const { date, time } = formatCreatedAt(payout.created_at);
            const isSuccess = payout.status === "credited" || payout.status === "succeeded";

            return (
              <div
                key={payout.payout_id}
                className="px-5 py-4 hover:bg-white/2 transition-colors"
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="mono text-base font-bold text-white tracking-tight">
                    Payout: Rs {payout.amount.toFixed(2)}
                  </span>
                  <span className="mono text-xs text-zinc-500">{date}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    {isSuccess ? (
                      <CheckCircle2 size={12} className="text-zinc-300" />
                    ) : (
                      <Clock3 size={12} className="text-zinc-500" />
                    )}
                    <span className="text-zinc-400">{payout.status}</span>
                  </div>
                  <span className="hidden sm:inline text-zinc-700">·</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-600">Decision:</span>
                    <span className="text-zinc-300 font-medium">{payout.decision}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-600">Event:</span>
                    <span className="mono text-zinc-400">{shortEvent(payout.event_id)}</span>
                  </div>
                  <span className="hidden sm:inline text-zinc-700">·</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-600">Time:</span>
                    <span className="mono text-zinc-400">{time}</span>
                  </div>
                </div>

                {payout.failure_reason && (
                  <div className="mt-2 flex items-start gap-1.5 text-[11px] text-zinc-500">
                    <AlertTriangle size={12} className="mt-px" />
                    <span>{payout.failure_reason}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer decorative bar */}
      <div className="px-5 py-2.5 bg-white/2 border-t border-white/4">
        <span className="mono text-[10px] text-zinc-600 uppercase tracking-widest">
          Live ledger sync · Backend-driven payout history
        </span>
      </div>
    </div>
  );
}
