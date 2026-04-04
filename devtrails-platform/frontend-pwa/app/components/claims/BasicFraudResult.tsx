import { AlertTriangle, BadgeCheck, Shield } from "lucide-react";
import type { ClaimFraudResult } from "./types";

type BasicFraudResultProps = {
  fraud: ClaimFraudResult;
};

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BasicFraudResult({ fraud }: BasicFraudResultProps) {
  const scorePercent = Math.min(Math.max(Math.round(fraud.score * 100), 0), 100);
  const thresholdPercent = Math.min(Math.max(Math.round(fraud.threshold * 100), 0), 100);
  const passed = fraud.outcome === "pass";

  return (
    <section className="glass-card rounded-2xl p-6 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold mb-2">Basic Fraud Result</p>
          <h2 className="text-lg font-semibold">Risk screening outcome</h2>
        </div>
        <Shield size={18} className="text-electric" />
      </header>

      <div className="rounded-xl border border-white/10 bg-white/4 p-4">
        <p className="text-[10px] uppercase tracking-wider text-white/45">Fraud Risk Score</p>
        <p className="text-2xl font-bold mt-1">{scorePercent}<span className="text-sm font-medium text-white/45"> / 100</span></p>

        <div className="relative mt-3">
          <div className="h-2.5 rounded-full bg-white/12 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                passed ? "bg-gradient-to-r from-teal-400 to-electric" : "bg-gradient-to-r from-red-400 to-amber-400"
              }`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <span
            className="absolute -top-1.5 h-5 w-px bg-white/40"
            style={{ left: `${thresholdPercent}%` }}
            aria-hidden
          />
        </div>
        <p className="text-[11px] text-white/45 mt-2">Threshold: {formatPercent(fraud.threshold)}</p>
      </div>

      <div
        className={`rounded-xl border px-3 py-2.5 flex items-center gap-2 text-sm font-medium ${
          passed
            ? "bg-teal-500/10 border-teal-400/30 text-teal-200"
            : "bg-red-500/10 border-red-400/30 text-red-200"
        }`}
      >
        {passed ? <BadgeCheck size={15} /> : <AlertTriangle size={15} />}
        {passed ? "Fraud check passed" : "Fraud check failed"}
      </div>

      <div className="text-xs text-white/50 space-y-1">
        <p>Evaluated at: {formatDate(fraud.evaluatedAt)}</p>
        <p>Model: {fraud.modelVersion}</p>
      </div>
    </section>
  );
}
