"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  Fuel,
  ShieldAlert,
  CloudLightning,
  CarFront,
  ServerOff,
  CheckCircle2,
  Wallet,
  MapPin,
  User,
  Activity,
  Zap,
} from "lucide-react";

import PredictiveAlertBanner from "@/components/PredictiveAlertBanner";
import AuditTrail from "@/components/AuditTrail";

// Dynamic import — no SSR for WebGL component
const ThreeBackground = dynamic(
  () => import("@/components/ThreeBackground"),
  { ssr: false }
);

// --- MOCK CONSTANTS ---
const RIDER_NAME = "Rahul — Delivery Partner";
const ACTIVE_ZONE = "Andheri West, Mumbai";
const CLAIM_AMOUNT = 350;

const COVERAGE_SCENARIOS = [
  { id: "fuel", title: "Fuel shortage (LPG / Petrol)", icon: Fuel },
  { id: "curfew", title: "Curfew or law enforcement", icon: ShieldAlert },
  { id: "weather", title: "Extreme weather events", icon: CloudLightning },
  { id: "traffic", title: "Festival traffic congestion", icon: CarFront },
  { id: "outage", title: "Food delivery platform outage", icon: ServerOff },
];

export default function Home() {
  // --- STATE ---
  const [walletBalance, setWalletBalance] = useState(1250);
  const [premiumAmount, setPremiumAmount] = useState(45);
  const [isAssessing, setIsAssessing] = useState(false);
  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: "red" | "green";
  } | null>(null);

  // --- HANDLERS ---
  const handleAiAssessment = () => {
    if (isAssessing) return;
    setIsAssessing(true);
    setTimeout(() => {
      setPremiumAmount(42);
      setIsAssessing(false);
    }, 2000);
  };

  const triggerSimulation = (scenarioTitle: string) => {
    setActiveToast({
      type: "red",
      message: `🚨 API Trigger: ${scenarioTitle} Detected in ${ACTIVE_ZONE}.`,
    });
    setTimeout(() => {
      setWalletBalance((prev) => prev + CLAIM_AMOUNT);
      setActiveToast({
        type: "green",
        message: `✅ Claim Auto-Approved! ₹${CLAIM_AMOUNT} transferred to your wallet for lost peak hours.`,
      });
      setTimeout(() => setActiveToast(null), 4000);
    }, 1500);
  };

  return (
    <>
      {/* Three.js WebGL Background */}
      <ThreeBackground />

      <main className="relative z-10 min-h-screen pb-36">
        {/* ====== TOP BAR ====== */}
        <header className="sticky top-0 z-30 glass-panel px-6 py-4 lg:px-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                <Zap size={18} className="text-black" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white hidden sm:inline">
                Gig Protect
              </span>
            </div>

            {/* Rider Profile */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white leading-tight">
                  {RIDER_NAME}
                </p>
                <p className="text-xs text-zinc-500 flex items-center justify-end gap-1 mt-0.5">
                  <MapPin size={10} />
                  {ACTIVE_ZONE}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                <User size={18} className="text-zinc-400" />
              </div>
            </div>
          </div>
        </header>

        {/* ====== DASHBOARD CONTENT ====== */}
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-6 lg:py-10 space-y-6">
          {/* Predictive Alert Banner */}
          <PredictiveAlertBanner />

          {/* Responsive Grid: 2 cols on lg+, 1 col on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ====== LEFT COLUMN (3/5 wide) ====== */}
            <div className="lg:col-span-3 space-y-6">
              {/* Wallet Card */}
              <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/[0.06]">
                    <Wallet size={20} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                      Wallet Balance
                    </p>
                    <p className="text-2xl font-bold tracking-tight text-white transition-all duration-500 mono">
                      ₹{walletBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-white/[0.06] text-zinc-400 px-3 py-1.5 rounded-full text-xs font-medium border border-white/[0.06]">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Active
                </div>
              </div>

              {/* AI Premium Dashboard Hero */}
              <div className="glass-card rounded-2xl relative overflow-hidden">
                {/* Decorative glow — subtle */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/[0.03] rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 p-6 lg:p-8">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                    <Activity size={14} />
                    Dynamic Weekly Premium
                  </h2>

                  <div className="mb-8">
                    {isAssessing ? (
                      <div className="animate-pulse flex items-baseline gap-3">
                        <div className="h-14 w-28 bg-zinc-800 rounded-lg" />
                        <div className="h-6 w-16 bg-zinc-800/50 rounded" />
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-6xl font-extrabold tracking-tighter text-white mono">
                          ₹{premiumAmount}
                        </span>
                        <span className="text-zinc-600 font-medium text-lg">
                          / week
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAiAssessment}
                    disabled={isAssessing}
                    className={`w-full py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 text-sm ${
                      isAssessing
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : "bg-white hover:bg-zinc-200 text-black shadow-[0_0_30px_rgba(255,255,255,0.08)] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-[0.98]"
                    }`}
                  >
                    {isAssessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                        <span>Analyzing historical data…</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} className="fill-black" />
                        <span>Run AI Risk Assessment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ====== RIGHT COLUMN (2/5 wide) ====== */}
            <div className="lg:col-span-2 space-y-6">
              {/* Coverage Scenarios */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
                    Covered Disruptions
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1">
                    Auto-payouts for loss of income during:
                  </p>
                </div>

                <div className="divide-y divide-white/[0.04]">
                  {COVERAGE_SCENARIOS.map((scenario) => {
                    const Icon = scenario.icon;
                    return (
                      <div
                        key={scenario.id}
                        className="px-5 py-3.5 flex items-center gap-3.5 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="p-2.5 rounded-xl bg-white/[0.05] text-zinc-400">
                          <Icon size={18} strokeWidth={1.5} />
                        </div>
                        <span className="flex-1 text-sm text-zinc-300 font-medium">
                          {scenario.title}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 bg-white/[0.05] px-2 py-1 rounded-full border border-white/[0.06]">
                          <CheckCircle2 size={10} />
                          Active
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Audit Trail */}
              <AuditTrail />
            </div>
          </div>
        </div>

        {/* ====== HACKATHON DEMO PANEL (fixed bottom) ====== */}
        <div className="fixed bottom-0 left-0 right-0 z-40 glass-panel px-5 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Developer Mock Controls
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 snap-x hide-scrollbar">
              {COVERAGE_SCENARIOS.map((scenario) => (
                <button
                  key={`demo-${scenario.id}`}
                  onClick={() => triggerSimulation(scenario.title)}
                  className="snap-start shrink-0 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-medium px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white transition-all whitespace-normal max-w-[140px] text-left leading-tight"
                >
                  Simulate: {scenario.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ====== TOAST / OVERLAY ALERTS ====== */}
      {activeToast && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={`w-full max-w-md mt-20 p-6 rounded-2xl shadow-2xl border flex items-start gap-4 transition-all ${
              activeToast.type === "red"
                ? "bg-zinc-950 border-white/10"
                : "bg-zinc-950 border-white/20"
            }`}
          >
            <div
              className={`mt-0.5 p-2.5 rounded-xl ${
                activeToast.type === "red"
                  ? "bg-white/[0.06] text-zinc-400"
                  : "bg-white/10 text-white"
              }`}
            >
              {activeToast.type === "red" ? (
                <ShieldAlert size={24} />
              ) : (
                <CheckCircle2 size={24} />
              )}
            </div>
            <div className="flex-1">
              <h3
                className={`font-bold text-sm mb-1 ${
                  activeToast.type === "red" ? "text-zinc-300" : "text-white"
                }`}
              >
                {activeToast.type === "red"
                  ? "Alert Triggered"
                  : "Payout Success"}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {activeToast.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
