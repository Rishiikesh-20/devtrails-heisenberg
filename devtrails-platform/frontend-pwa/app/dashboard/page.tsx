"use client";

import React, { useMemo, useState } from "react";

import { PredictiveAlertBanner } from "../components/dashboard/PredictiveAlertBanner";
import { AuditTrail } from "../components/dashboard/AuditTrail";
import type { OnboardingPayload, RegisterResponse } from "../lib/types";

const REGISTRATION_KEY = "wagelock.registration";
const ONBOARDING_KEY = "wagelock.onboarding";

const COVERAGE_SCENARIOS = [
  "Fuel shortage (LPG / Petrol)",
  "Curfew or law enforcement",
  "Extreme weather events",
  "Festival traffic congestion",
  "Food delivery platform outage",
];

export default function DashboardPage() {
  const [registration] = useState<RegisterResponse | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = sessionStorage.getItem(REGISTRATION_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as RegisterResponse;
    } catch {
      return null;
    }
  });

  const [onboarding] = useState<OnboardingPayload | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = sessionStorage.getItem(ONBOARDING_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as OnboardingPayload;
    } catch {
      return null;
    }
  });

  const walletBalance = useMemo(() => {
    const premiumBoost = registration
      ? Math.round(registration.weekly_premium)
      : 0;
    return 1250 + premiumBoost;
  }, [registration]);

  const finalPremium =
    registration?.pricing_breakdown?.final_premium ??
    registration?.weekly_premium ??
    45;
  const activeCoverageLabel = useMemo(() => {
    if (!registration) return "Active";
    return `Tier ${registration.tier} Active`;
  }, [registration]);

  return (
    <main className="min-h-screen bg-[#08172c] text-white pb-14">
      <header className="sticky top-0 z-30 bg-[#08172c]/90 backdrop-blur border-b border-white/10 px-5 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
              <span className="text-sm font-bold">WL</span>
            </div>
            <div>
              <p className="text-sm font-semibold">
                WageLock Zero-Touch Wallet
              </p>
              <p className="text-xs text-white/60">
                Auto-protected income during disruptions
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">
              {onboarding?.full_name ?? "Delivery Partner"}
            </p>
            <p className="text-xs text-white/60">
              {registration?.zone ?? onboarding?.zone ?? "south_delhi"}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 py-8 space-y-6">
        <PredictiveAlertBanner />

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-2">
                Wallet Balance
              </p>
              <p className="text-4xl font-extrabold tracking-tight mb-4">
                Rs {walletBalance.toLocaleString()}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <span className="status-pill status-pill-active">
                  {activeCoverageLabel}
                </span>
                <span className="text-xs text-white/60">
                  Zero-touch claim flow enabled
                </span>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-2">
                Active Coverage Premium
              </p>
              <p className="text-3xl font-extrabold mb-1">
                Rs {finalPremium.toFixed(2)} / week
              </p>
              <p className="text-sm text-white/70">
                AI priced this policy for your current zone and shift schedule.
                No manual claim button is required.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <section className="glass-card rounded-2xl overflow-hidden">
              <header className="px-5 py-4 border-b border-white/10">
                <h3 className="text-sm font-semibold uppercase tracking-wide">
                  Covered Disruptions
                </h3>
              </header>
              <div className="divide-y divide-white/10">
                {COVERAGE_SCENARIOS.map((item) => (
                  <div
                    key={item}
                    className="px-5 py-3 flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-white/85">{item}</span>
                    <span className="text-[10px] uppercase tracking-wider text-teal-300 border border-teal-300/40 rounded-full px-2 py-1">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <AuditTrail />
          </div>
        </section>
      </div>
    </main>
  );
}
