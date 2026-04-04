"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Shield,
  CloudRain,
  ServerOff,
  ShieldAlert,
  TrafficCone,
  Fuel,
  FileText,
  CloudSun,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { PageShell } from "../components/ui/PageShell";
import { useToast } from "../components/ui/ToastProvider";
import { getUser, getOnboarding, apiGet } from "../lib/api";
import { TIER_INFO } from "../lib/constants";
import type {
  WalletResponse,
  PayoutListResponse,
  PayoutListItem,
  ClaimListResponse,
  ClaimListItem,
} from "../lib/types";

const COVERAGE_ITEMS = [
  { label: "Extreme Weather Events", icon: CloudRain, color: "#2563EB" },
  { label: "Platform Outage", icon: ServerOff, color: "#8B5CF6" },
  { label: "Curfew / Section 144", icon: ShieldAlert, color: "#EF4444" },
  { label: "Festival Traffic", icon: TrafficCone, color: "#F59E0B" },
  { label: "Fuel / LPG Shortage", icon: Fuel, color: "#14B8A6" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [onboarding, setOnboarding] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  const [walletBalance, setWalletBalance] = useState(0);
  const [payouts, setPayouts] = useState<PayoutListItem[]>([]);
  const [claims, setClaims] = useState<ClaimListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadedUser = getUser();
    setUser(loadedUser);
    setOnboarding(getOnboarding());
    setMounted(true);

    const userId = loadedUser?.id;
    if (!userId) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [walletRes, payoutsRes, claimsRes] = await Promise.all([
          apiGet<WalletResponse>(
            `/wallet?user_id=${encodeURIComponent(userId)}`,
            controller.signal,
          ),
          apiGet<PayoutListResponse>(
            `/payouts?user_id=${encodeURIComponent(userId)}`,
            controller.signal,
          ),
          apiGet<ClaimListResponse>(
            `/claims?user_id=${encodeURIComponent(userId)}`,
            controller.signal,
          ),
        ]);

        setWalletBalance(walletRes.balance ?? 0);
        setPayouts(payoutsRes.items ?? []);
        setClaims(claimsRes.items ?? []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unable to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => controller.abort();
  }, [router]);

  if (!mounted) return null;
  if (!user) return null;

  const tierInfo = TIER_INFO[user.tier] ?? TIER_INFO[3];
  const premium = user.pricing_breakdown?.final_premium ?? user.weekly_premium ?? 0;
  const approvedClaims = claims.filter((c) => c.status === "approved").length;

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-6">
        {/* ── Alert Banner ─────────────────────────── */}
        {claims.length > 0 && (
          <div className="rounded-xl border border-electric/20 bg-electric/5 p-4 flex items-start gap-3">
            <div className="mt-0.5 flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-electric animate-pulse" />
            </div>
            <p className="text-sm text-white/70 leading-snug flex-1">
              Latest claim: {claims[0].decision} for event {claims[0].event_id.slice(0, 8)}...
              Coverage remains active.
            </p>
          </div>
        )}

        {/* ── Main Grid ────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Balance */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
                    Wallet Balance
                  </p>
                  {loading ? (
                    <div className="skeleton h-10 w-40" />
                  ) : (
                    <p className="text-4xl font-extrabold tracking-tight count-up">
                      ₹{walletBalance.toLocaleString("en-IN")}
                    </p>
                  )}
                  {error && (
                    <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {error}
                    </p>
                  )}
                </div>
                <Wallet size={22} className="text-electric" />
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span
                  className="status-pill text-[10px]"
                  style={{
                    background: `${tierInfo.color}15`,
                    color: tierInfo.color,
                    border: `1px solid ${tierInfo.color}30`,
                  }}
                >
                  Tier {user.tier} · {tierInfo.name}
                </span>
                <span className="text-[10px] text-white/40">
                  Zero-touch claim flow enabled
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard
                label="Weekly Premium"
                value={`₹${premium.toFixed(0)}`}
                icon={<Shield size={16} />}
                color="text-electric"
              />
              <StatCard
                label="Total Claims"
                value={claims.length.toString()}
                icon={<FileText size={16} />}
                color="text-amber-400"
              />
              <StatCard
                label="Approved"
                value={approvedClaims.toString()}
                icon={<CheckCircle2 size={16} />}
                color="text-teal-400"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => router.push("/reports")}
                className="glass-card rounded-xl p-5 flex items-center gap-4 hover:bg-white/[0.06] transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-amber-400" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold">Report Disruption</p>
                  <p className="text-[11px] text-white/40">Feed our consensus engine</p>
                </div>
                <ArrowUpRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
              </button>
              <button
                type="button"
                onClick={() => router.push("/weather")}
                className="glass-card rounded-xl p-5 flex items-center gap-4 hover:bg-white/[0.06] transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <CloudSun size={18} className="text-blue-400" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold">Weather Signals</p>
                  <p className="text-[11px] text-white/40">Live oracle readings</p>
                </div>
                <ArrowUpRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
              </button>
            </div>

            {/* Payout History */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                  Auto Payout Ledger
                </h3>
                <TrendingUp size={14} className="text-white/20" />
              </div>
              <div className="divide-y divide-white/[0.04]">
                {loading ? (
                  <div className="px-5 py-8">
                    <div className="skeleton h-12 w-full mb-3" />
                    <div className="skeleton h-12 w-full" />
                  </div>
                ) : payouts.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-xs text-white/30">
                      No payouts yet. Your ledger will update after the first approved claim.
                    </p>
                  </div>
                ) : (
                  payouts.slice(0, 5).map((payout) => (
                    <PayoutRow key={payout.payout_id} payout={payout} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Coverage */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                  Covered Disruptions
                </h3>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {COVERAGE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="px-5 py-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={14} style={{ color: item.color }} />
                        <span className="text-sm text-white/70">{item.label}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-teal-400 border border-teal-400/20 rounded-full px-2 py-0.5 font-semibold">
                        Active
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Premium info */}
            <div className="glass-card rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
                Active Premium
              </p>
              <p className="text-2xl font-extrabold tracking-tight">
                ₹{premium.toFixed(2)}<span className="text-sm font-normal text-white/40"> /week</span>
              </p>
              <p className="text-xs text-white/40 mt-2">
                AI-priced for your zone and shift schedule. No manual claims required.
              </p>
            </div>

            {/* Recent claims */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                  Recent Claims
                </h3>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {loading ? (
                  <div className="px-5 py-6">
                    <div className="skeleton h-8 w-full mb-2" />
                    <div className="skeleton h-8 w-full" />
                  </div>
                ) : claims.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-xs text-white/30">No claims recorded yet.</p>
                  </div>
                ) : (
                  claims.slice(0, 3).map((claim) => (
                    <div key={`${claim.event_id}-${claim.created_at}`} className="px-5 py-3.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white/70">
                          {claim.event_id.slice(0, 8)}...
                        </span>
                        <span className="flex items-center gap-1 text-[10px]">
                          {claim.status === "approved" ? (
                            <CheckCircle2 size={10} className="text-teal-400" />
                          ) : (
                            <Clock size={10} className="text-amber-400" />
                          )}
                          <span className="text-white/40">{claim.status}</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-white/30">
                        FRS: {claim.frs_score} · {claim.decision}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className={`${color} mb-3`}>{icon}</div>
      <p className="text-xl font-bold tracking-tight count-up">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-white/30 mt-0.5">{label}</p>
    </div>
  );
}

function PayoutRow({ payout }: { payout: PayoutListItem }) {
  const d = new Date(payout.created_at);
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base font-bold text-white">
            ₹{payout.amount.toFixed(2)}
          </span>
          {payout.status === "credited" || payout.status === "succeeded" ? (
            <CheckCircle2 size={12} className="text-teal-400" />
          ) : (
            <Clock size={12} className="text-amber-400" />
          )}
        </div>
        <p className="text-[10px] text-white/30 truncate">
          Event: {payout.event_id.slice(0, 12)}...
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-[10px] text-white/30 block">{date}</span>
        <span className="text-[10px] text-white/20">{time}</span>
      </div>
    </div>
  );
}
