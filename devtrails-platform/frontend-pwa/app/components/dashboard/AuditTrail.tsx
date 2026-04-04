import React from "react";

const MOCK_PAYOUTS = [
  {
    id: 1,
    amount: "Rs 622",
    date: "Mar 14",
    trigger: "Curfew alert",
    source: "Gov API",
  },
  {
    id: 2,
    amount: "Rs 305",
    date: "Mar 10",
    trigger: "Rainfall > 22mm/hr",
    source: "Weather API",
  },
];

export function AuditTrail() {
  return (
    <section className="premium-card overflow-hidden">
      <header className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Auto Payout Ledger
        </h3>
      </header>

      <div className="divide-y divide-gray-100">
        {MOCK_PAYOUTS.map((payout) => (
          <div key={payout.id} className="px-5 py-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-base font-bold text-gray-900">
                {payout.amount}
              </span>
              <span className="text-xs text-gray-500">{payout.date}</span>
            </div>
            <p className="text-xs text-gray-600">Trigger: {payout.trigger}</p>
            <p className="text-xs text-gray-500">Source: {payout.source}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
