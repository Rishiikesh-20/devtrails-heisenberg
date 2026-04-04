import { CheckCircle2, FileSearch, XCircle } from "lucide-react";
import type { ClaimDecision } from "./types";

type DecisionReasonPanelProps = {
  decision: ClaimDecision;
  summary: string;
  reasons: string[];
  claimAmount: number;
  payoutAmount: number;
  decidedAt?: string;
};

function formatInr(value: number): string {
  return `₹${Math.max(0, value).toLocaleString("en-IN")}`;
}

function formatDecisionAt(value?: string): string {
  if (!value) {
    return "Pending final decision";
  }
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DecisionReasonPanel({
  decision,
  summary,
  reasons,
  claimAmount,
  payoutAmount,
  decidedAt,
}: DecisionReasonPanelProps) {
  const approved = decision === "approved";

  return (
    <section className="glass-card rounded-2xl p-6 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold mb-2">Decision Reason</p>
          <h2 className="text-lg font-semibold">Why this claim was {decision}</h2>
        </div>

        <span
          className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold border ${
            approved
              ? "bg-teal-500/12 text-teal-200 border-teal-400/30"
              : "bg-red-500/12 text-red-200 border-red-400/35"
          }`}
        >
          {decision}
        </span>
      </header>

      <div className="rounded-xl border border-white/10 bg-white/4 p-4">
        <p className="text-sm leading-relaxed text-white/85">{summary}</p>
        <p className="text-xs text-white/45 mt-2 inline-flex items-center gap-1.5">
          <FileSearch size={12} /> Decision timestamp: {formatDecisionAt(decidedAt)}
        </p>
      </div>

      <ul className="space-y-2.5">
        {reasons.map((reason) => (
          <li key={reason} className="text-sm text-white/75 flex gap-2.5">
            <span className="mt-0.5 shrink-0">
              {approved ? (
                <CheckCircle2 size={14} className="text-teal-300" />
              ) : (
                <XCircle size={14} className="text-red-300" />
              )}
            </span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/4 p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/45">Claim Amount</p>
          <p className="text-base font-semibold mt-1">{formatInr(claimAmount)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/4 p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/45">Payout Amount</p>
          <p className="text-base font-semibold mt-1 text-teal-200">{formatInr(payoutAmount)}</p>
        </div>
      </div>
    </section>
  );
}
