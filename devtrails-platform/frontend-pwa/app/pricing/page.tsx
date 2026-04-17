"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, CheckCircle, Shield, CloudRain, ServerOff, ShieldAlert, TrafficCone, Fuel } from "lucide-react";
import { useToast } from "../components/ui/ToastProvider";
import { apiPost, getUser, setUser } from "../lib/api";
import { TIER_INFO } from "../lib/constants";
import type { PolicyActionResponse, RegisterResponse } from "../lib/types";

const COVERAGE_ICONS = {
  1: [CloudRain, ServerOff],
  2: [CloudRain, ServerOff, ShieldAlert, TrafficCone],
  3: [CloudRain, ServerOff, ShieldAlert, TrafficCone, Fuel],
};
const COVERAGE_LABELS = {
  1: ["Heavy Rain / Extreme Weather", "Platform Outage"],
  2: ["Heavy Rain / Extreme Weather", "Platform Outage", "Curfew / Section 144", "Festival Traffic"],
  3: ["Heavy Rain / Extreme Weather", "Platform Outage", "Curfew / Section 144", "Festival Traffic", "Fuel / LPG Shortage"],
};

export default function PricingPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [data, setData] = useState<RegisterResponse | null>(null);
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3>(3);
  const [accepted, setAccepted] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/onboarding");
      return;
    }

    const initialTier = user.tier as 1 | 2 | 3;
    setSelectedTier(initialTier || 3);
    setData(user);
  }, [router]);

  const handleAccept = async () => {
    if (!data?.id || activating || accepted) {
      return;
    }

    setActivating(true);
    try {
      const res = await apiPost<PolicyActionResponse>("/api/v1/policy/activate", {
        user_id: data.id,
        auto_renew_enabled: true,
        target_tier: selectedTier,
      });

      setAccepted(true);
      setData(res.user);
      setSelectedTier((res.user.tier as 1 | 2 | 3) || selectedTier);
      setUser(res.user);
      addToast(res.message || "Protection activated! Your wallet is now live.", "success");
      setTimeout(() => router.push("/dashboard"), 700);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Unable to activate protection now.", "error");
    } finally {
      setActivating(false);
    }
  };

  if (!data) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] py-12 px-5">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-28 mb-4" />
          <div className="h-8 bg-gray-100 rounded w-3/4 mb-6" />
          <div className="h-40 bg-gray-100 rounded" />
        </div>
      </main>
    );
  }

  const pricing = data.pricing_breakdown;
  const recommendedTier = data.tier as 1 | 2 | 3;
  const tier = selectedTier ?? recommendedTier;
  const tierInfo = TIER_INFO[tier] ?? TIER_INFO[3];
  const coverageIcons = COVERAGE_ICONS[tier] ?? COVERAGE_ICONS[3];
  const coverageLabels = tierInfo.eventsCovered ?? COVERAGE_LABELS[tier] ?? COVERAGE_LABELS[3];
  const basePrice = pricing?.base_price ?? 250;
  const finalPremium = tierInfo.weeklyPremium;
  const aiRiskDiscount = finalPremium - basePrice;

  return (
    <main className="min-h-screen bg-[#F8FAFC] py-12 px-5">
      <div className="max-w-2xl mx-auto">
        {/* Logo + Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="flex items-center gap-2 mr-2">
            <div className="w-8 h-8 rounded-lg bg-electric flex items-center justify-center">
              <Shield size={15} strokeWidth={2.5} className="text-white" />
            </div>
          </Link>
          <Link
            href="/onboarding"
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={16} className="text-gray-600" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              {[1, 2, 3].map((step) => (
                <div key={step} className="h-1.5 flex-1 rounded-full bg-electric" />
              ))}
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-gray-400">
              Step 3 of 3 — Review Your Premium
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
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

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-6">
          {/* AI check */}
          <div className="flex items-center gap-2">
            <CheckCircle size={15} className="text-teal-500" />
            <p className="text-sm font-semibold text-teal-700">AI Risk Analysis Complete</p>
          </div>

          {/* Tier chooser */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Choose your tier plan</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((tierValue) => {
                const planTier = tierValue as 1 | 2 | 3;
                const plan = TIER_INFO[planTier];
                const isSelected = tier === planTier;
                const isRecommended = recommendedTier === planTier;

                return (
                  <button
                    key={tierValue}
                    type="button"
                    onClick={() => setSelectedTier(planTier)}
                    disabled={accepted || activating}
                    className={`text-left rounded-xl border p-4 transition-all ${
                      isSelected
                        ? "border-electric bg-electric/5"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    } ${accepted ? "cursor-default" : ""}`}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Tier {tierValue}</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{plan.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{plan.tagline}</p>
                    <p className="text-lg font-extrabold text-gray-900 mt-3">₹{plan.weeklyPremium}/week</p>
                    <p className="text-xs text-gray-500 mt-1">Max {plan.maxPayout}</p>
                    {isRecommended && (
                      <span className="inline-flex mt-3 text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-100 px-2 py-1 rounded-md">
                        AI Recommended
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tier badge */}
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg"
              style={{
                background: `${tierInfo.color}12`,
                color: tierInfo.color,
                border: `1px solid ${tierInfo.color}25`,
              }}
            >
              Tier {tier} — {tierInfo.name}
            </span>
            <span className="text-sm font-semibold text-gray-600">
              Max {tierInfo.maxPayout} coverage
            </span>
          </div>

          {/* Pricing breakdown */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Base Price</span>
				<span className="text-sm text-gray-400 line-through">₹{basePrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">AI Risk Discount</span>
              <span className="text-sm font-bold text-teal-600">
					{aiRiskDiscount <= 0 ? "−" : "+"}₹{Math.abs(aiRiskDiscount).toFixed(2)}
              </span>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">Final Premium</span>
              <div className="text-right">
					<span className="text-3xl font-extrabold text-gray-900 count-up">₹{finalPremium.toFixed(2)}</span>
                <p className="text-xs text-gray-400 mt-0.5">per week</p>
              </div>
            </div>
          </div>

          {/* Covered events for this tier */}
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
              Events covered in your plan
            </p>
            <div className="grid grid-cols-1 gap-2">
              {coverageLabels.map((label, i) => {
                const Icon = coverageIcons[i];
                return (
                  <div key={label} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-6 h-6 rounded-lg bg-electric/8 flex items-center justify-center shrink-0">
                      <Icon size={12} className="text-electric" />
                    </div>
                    {label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">AI Reasoning</p>
            <p className="text-sm text-gray-700 leading-relaxed">{pricing.reason}</p>
          </div>

          {/* Key terms */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Co-Pay", value: "20%", sub: "You retain 20%" },
              { label: "Waiting", value: "48 hrs", sub: "Activation delay" },
              { label: "Payout", value: "<10 min", sub: "Direct to UPI" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                <p className="text-base font-extrabold text-gray-900">{item.value}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{item.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            id="pricing-accept"
            onClick={handleAccept}
            disabled={accepted || activating}
            className="w-full inline-flex items-center justify-center gap-2 bg-electric hover:bg-electric-600 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {accepted ? (
              <>
                <CheckCircle size={16} />
                Protection Activated!
              </>
            ) : activating ? (
              "Activating protection..."
            ) : (
              `Accept Tier ${tier} & Activate Protection →`
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
