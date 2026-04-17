import { AlertTriangle, BadgeCheck, Shield } from "lucide-react";
import type { ClaimFraudResult } from "./types";

type BasicFraudResultProps = { fraud: ClaimFraudResult };

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function BasicFraudResult({ fraud }: BasicFraudResultProps) {
  const scorePercent = Math.min(Math.max(Math.round(fraud.score * 100), 0), 100);
  const thresholdPercent = Math.min(Math.max(Math.round(fraud.threshold * 100), 0), 100);
  const passed = fraud.outcome === "pass";

  return (
    <section className="premium-card p-6 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold mb-1">
            Basic Fraud Result
          </p>
          <h2 className="text-lg font-bold text-gray-900">Risk screening outcome</h2>
        </div>
        <div className="w-9 h-9 rounded-xl bg-electric/8 flex items-center justify-center shrink-0">
          <Shield size={18} className="text-electric" />
        </div>
      </header>

      {/* Score bar */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Fraud Risk Score</p>
        <p className="text-2xl font-extrabold text-gray-900 mt-1">
          {scorePercent}
          <span className="text-sm font-semibold text-gray-400"> / 100</span>
        </p>

        <div className="relative mt-3">
          <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                passed ? "bg-gradient-to-r from-teal-400 to-electric" : "bg-gradient-to-r from-red-400 to-amber-400"
              }`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          {/* Threshold marker */}
          <span
            className="absolute -top-1.5 h-5 w-0.5 bg-gray-500 rounded"
            style={{ left: `${thresholdPercent}%` }}
            aria-hidden
          />
        </div>
        <p className="text-[11px] text-gray-500 font-medium mt-2">
          Threshold: {formatPercent(fraud.threshold)}
        </p>
      </div>

      {/* Outcome badge */}
      <div className={`rounded-xl border px-4 py-3 flex items-center gap-2 text-sm font-semibold ${
        passed
          ? "bg-teal-50 border-teal-200 text-teal-700"
          : "bg-red-50 border-red-200 text-red-700"
      }`}>
        {passed ? <BadgeCheck size={16} /> : <AlertTriangle size={16} />}
        {passed ? "Fraud check passed" : "Fraud check failed"}
      </div>

      {/* Meta */}
      <div className="text-xs text-gray-500 space-y-0.5">
        <p>Evaluated at: <span className="font-medium text-gray-700">{formatDate(fraud.evaluatedAt)}</span></p>
        <p>Model: <span className="font-medium text-gray-700">{fraud.modelVersion}</span></p>
      </div>
    </section>
  );
}
