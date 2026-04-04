"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, CheckCircle } from "lucide-react";
import { useToast } from "../components/ui/ToastProvider";
import { getUser } from "../lib/api";
import { TIER_INFO } from "../lib/constants";
import type { RegisterResponse } from "../lib/types";

export default function PricingPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [data, setData] = useState<RegisterResponse | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/onboarding");
      return;
    }
    setData(user);
  }, [router]);

  const handleAccept = () => {
    setAccepted(true);
    addToast("Protection activated! Your wallet is now live. 🛡️", "success");
    setTimeout(() => router.push("/dashboard"), 800);
  };

  if (!data) {
    return (
      <main className="min-h-screen bg-background py-12 px-5">
        <div className="max-w-2xl mx-auto premium-card p-8 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-28 mb-4" />
          <div className="h-8 bg-gray-100 rounded w-3/4 mb-6" />
          <div className="h-40 bg-gray-100 rounded" />
        </div>
      </main>
    );
  }

  const pricing = data.pricing_breakdown;
  const tier = data.tier;
  const tierInfo = TIER_INFO[tier] ?? TIER_INFO[3];

  return (
    <main className="min-h-screen bg-background py-12 px-5">
      <div className="max-w-2xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/onboarding"
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={16} className="text-gray-600" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className="h-1.5 flex-1 rounded-full bg-electric transition-colors"
                />
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-400">
              Step 3 of 3
            </p>
          </div>
        </div>

        <div className="mb-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-electric/10 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-electric" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric mb-1">
              AI Pricing Ready
            </p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Your Personalized Premium
            </h1>
          </div>
        </div>

        <section className="premium-card p-6 md:p-8">
          <div className="flex items-center gap-2 mb-5">
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-teal">
              AI Risk Analysis Complete
            </p>
            <CheckCircle size={14} className="text-teal" />
          </div>

          {/* Tier badge */}
          <div className="flex items-center gap-3 mb-6">
            <span
              className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg"
              style={{
                background: `${tierInfo.color}15`,
                color: tierInfo.color,
                border: `1px solid ${tierInfo.color}30`,
              }}
            >
              Tier {tier} — {tierInfo.name}
            </span>
            <span className="text-xs text-gray-400">
              Max {tierInfo.maxPayout}
            </span>
          </div>

          {/* Pricing breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Base Price</span>
              <span className="text-sm text-gray-400 line-through">
                ₹{pricing.base_price.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">AI Risk Discount</span>
              <span className="text-sm font-semibold text-teal">
                {pricing.ai_risk_discount <= 0 ? "-" : "+"}₹{" "}
                {Math.abs(pricing.ai_risk_discount).toFixed(2)}
              </span>
            </div>

            <div className="h-px bg-gray-100" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                Final Premium
              </span>
              <span className="text-3xl font-extrabold text-gray-900 count-up">
                ₹{pricing.final_premium.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-400 text-right">per week</p>
          </div>

          {/* AI Reasoning */}
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
            onClick={handleAccept}
            disabled={accepted}
            className="mt-6 w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {accepted ? (
              <>
                <CheckCircle size={16} />
                Protection Activated!
              </>
            ) : (
              "Accept & Activate Protection"
            )}
          </button>
        </section>
      </div>
    </main>
  );
}
