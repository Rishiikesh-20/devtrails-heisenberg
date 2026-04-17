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
  if (!value) return "Pending final decision";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function DecisionReasonPanel({
  decision, summary, reasons, claimAmount, payoutAmount, decidedAt,
}: DecisionReasonPanelProps) {
  const approved = decision === "approved";

  return (
    <section className="premium-card p-6 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold mb-1">
            Decision Reason
          </p>
          <h2 className="text-lg font-bold text-gray-900">
            Why this claim was {decision}
          </h2>
        </div>

        <span className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full font-bold border ${
          approved
            ? "bg-teal-50 text-teal-700 border-teal-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {decision}
        </span>
      </header>

      {/* Summary box */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
        <p className="text-sm leading-relaxed text-gray-800">{summary}</p>
        <p className="text-xs text-gray-500 mt-2 inline-flex items-center gap-1.5 font-medium">
          <FileSearch size={12} className="text-gray-400" />
          Decision timestamp: {formatDecisionAt(decidedAt)}
        </p>
      </div>

      {/* Reasons list */}
      <ul className="space-y-2.5">
        {reasons.map((reason) => (
          <li key={reason} className="text-sm text-gray-700 flex gap-2.5 items-start">
            <span className="mt-0.5 shrink-0">
              {approved
                ? <CheckCircle2 size={14} className="text-teal-500" />
                : <XCircle size={14} className="text-red-500" />}
            </span>
            <span>{reason}</span>
          </li>
        ))}
      </ul>

      {/* Amount grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Claim Amount</p>
          <p className="text-lg font-bold text-gray-900">{formatInr(claimAmount)}</p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Payout Amount</p>
          <p className="text-lg font-bold text-teal-600">{formatInr(payoutAmount)}</p>
        </div>
      </div>

      {!approved && (
        <div className="pt-2 mt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-gray-800">Disagree with this AI decision?</p>
            <p className="text-[10px] text-gray-500 mt-0.5">You have 72 hours to request a manual review.</p>
          </div>
          <button className="text-xs font-bold text-electric px-4 py-2 rounded-xl bg-electric/10 hover:bg-electric/20 transition-colors shrink-0">
            File a Dispute
          </button>
        </div>
      )}
    </section>
  );
}
