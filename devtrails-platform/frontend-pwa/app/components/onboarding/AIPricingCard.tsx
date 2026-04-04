import React from "react";

import type { PricingBreakdown } from "../../lib/types";

type AIPricingCardProps = {
  pricing: PricingBreakdown;
  tier: number;
  onAccept: () => void;
  loading?: boolean;
};

export function AIPricingCard({
  pricing,
  tier,
  onAccept,
  loading = false,
}: AIPricingCardProps) {
  return (
    <section className="premium-card p-6 md:p-8">
      <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-teal mb-2">
        AI Risk Analysis
      </p>
      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
        Your Dynamic Weekly Premium
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        Risk tier {tier} generated from zone and shift intelligence.
      </p>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Base Price</span>
          <span className="text-sm text-gray-400 line-through">
            Rs {pricing.base_price.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">AI Risk Discount</span>
          <span className="text-sm font-semibold text-teal">
            {pricing.ai_risk_discount <= 0 ? "-" : "+"}Rs{" "}
            {Math.abs(pricing.ai_risk_discount).toFixed(2)}
          </span>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            Final Premium
          </span>
          <span className="text-2xl font-extrabold text-gray-900">
            Rs {pricing.final_premium.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-gray-50 border border-gray-100 p-4">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
          AI Reasoning
        </p>
        <p className="mt-2 text-sm text-gray-700 leading-relaxed">
          {pricing.reason}
        </p>
      </div>

      <button
        type="button"
        onClick={onAccept}
        disabled={loading}
        className="mt-6 w-full btn-primary disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : "Accept & Pay"}
      </button>
    </section>
  );
}
