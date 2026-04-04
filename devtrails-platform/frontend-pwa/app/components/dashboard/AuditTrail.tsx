import React from "react";

import type { PayoutListItem } from "../../lib/types";

type AuditTrailProps = {
  payouts: PayoutListItem[];
  currency: string;
  loading: boolean;
  error: string | null;
};

function formatDate(dateString: string): string {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function toCurrencyLabel(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) {
    return "Rs 0.00";
  }

  const normalized = currency.trim().toUpperCase();
  if (normalized === "INR" || normalized === "") {
    return `Rs ${amount.toFixed(2)}`;
  }

  return `${normalized} ${amount.toFixed(2)}`;
}

export function AuditTrail({ payouts, currency, loading, error }: AuditTrailProps) {
  const hasNoPayouts = !loading && !error && payouts.length === 0;

  return (
    <section className="premium-card overflow-hidden">
      <header className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Auto Payout Ledger
        </h3>
      </header>

      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="px-5 py-4 text-xs text-gray-500">
            Loading payout history...
          </div>
        ) : null}

        {error ? (
          <div className="px-5 py-4 text-xs text-red-600">
            {error}
          </div>
        ) : null}

        {payouts.map((payout) => (
          <div key={payout.payout_id} className="px-5 py-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-base font-bold text-gray-900">
                {toCurrencyLabel(payout.amount, currency)}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(payout.created_at)}
              </span>
            </div>
            <p className="text-xs text-gray-600">Trigger: {payout.event_id}</p>
            <p className="text-xs text-gray-500">
              Decision: {payout.decision} ({payout.status})
            </p>
          </div>
        ))}

        {hasNoPayouts ? (
          <div className="px-5 py-4 text-xs text-gray-500">
            No payouts yet. Your ledger will update after the first approved claim.
          </div>
        ) : null}
      </div>
    </section>
  );
}
