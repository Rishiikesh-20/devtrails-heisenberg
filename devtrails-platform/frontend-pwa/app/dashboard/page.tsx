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
  TrendingUp,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { PageShell } from "../components/ui/PageShell";
import { getUser, apiGet } from "../lib/api";
import { TIER_INFO } from "../lib/constants";
import type {
  RegisterResponse,
  WalletResponse,
  PayoutListResponse,
  PayoutListItem,
  ClaimListResponse,
  ClaimListItem,
} from "../lib/types";

const COVERAGE_ITEMS = [
  { label: "Extreme Weather Events", icon: CloudRain, color: "#2563EB", bg: "bg-blue-50" },
  { label: "Platform Outage", icon: ServerOff, color: "#8B5CF6", bg: "bg-violet-50" },
  { label: "Curfew / Section 144", icon: ShieldAlert, color: "#EF4444", bg: "bg-red-50" },
  { label: "Festival Traffic", icon: TrafficCone, color: "#F59E0B", bg: "bg-amber-50" },
  { label: "Fuel / LPG Shortage", icon: Fuel, color: "#14B8A6", bg: "bg-teal-50" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<RegisterResponse | null>(null);
  const [mounted, setMounted] = useState(false);

  const [walletBalance, setWalletBalance] = useState(0);
  const [payouts, setPayouts] = useState<PayoutListItem[]>([]);
  const [claims, setClaims] = useState<ClaimListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadedUser = getUser();
    setUser(loadedUser);
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
          apiGet<WalletResponse>(`/wallet?user_id=${encodeURIComponent(userId)}`, controller.signal),
          apiGet<PayoutListResponse>(`/payouts?user_id=${encodeURIComponent(userId)}`, controller.signal),
          apiGet<ClaimListResponse>(`/claims?user_id=${encodeURIComponent(userId)}`, controller.signal),
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
  const maxCoverage = parseMaxPayoutAmount(tierInfo.maxPayout);
  const coverageUsedThisCycle = payouts
    .filter((item) => isSettledPayout(item.status))
    .filter((item) => new Date(item.created_at).getTime() >= getCurrentCycleStart().getTime())
    .reduce((sum, item) => sum + item.amount, 0);
  const coverageLeft = Math.max(maxCoverage - coverageUsedThisCycle, 0);
  const nextRenewalAt = getNextWeeklyRenewalIso(new Date());

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-6">
        {/* ── Alert Banner */}
        {claims.length > 0 && (
          <div className="rounded-xl border border-electric/20 bg-electric/5 p-4 flex items-start gap-3">
            <div className="mt-0.5 flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-electric animate-pulse" />
            </div>
            <p className="text-sm text-electric/80 leading-snug flex-1">
              Latest claim: {claims[0].decision} for event {claims[0].event_id.slice(0, 8)}...
              Coverage remains active.
            </p>
          </div>
        )}

        {/* ── Predictive Insight Alert (Section 8 of Model) */}
        <section className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <AlertCircle size={64} className="text-amber-500" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-amber-600 mb-1 flex items-center gap-1.5">
                <AlertCircle size={12} /> Live Predictive Alert
              </p>
              <h3 className="text-sm font-bold text-gray-900 mt-0.5">Heavy Rain expected tomorrow (68% probability)</h3>
              <p className="text-xs text-gray-600 mt-1 max-w-lg leading-relaxed">
                Your current Tier 1 plan covers actual rain delays, but severe waterlogging often causes extended outages.
                Protect your shift income by temporarily upgrading to Tier 2 for the rest of this weekly cycle.
              </p>
            </div>
            <button className="whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-3 rounded-xl transition-colors shadow-sm shadow-amber-500/20 active:scale-[0.98]">
              Upgrade to Tier 2 (+ ₹20) <ArrowUpRight size={14} />
            </button>
          </div>
        </section>

        {/* ── Main Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Balance */}
            <div className="premium-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Wallet Balance
                  </p>
                  {loading ? (
                    <div className="skeleton-light h-10 w-40 rounded-xl" />
                  ) : (
                    <p className="text-4xl font-extrabold tracking-tight text-gray-900 count-up">
                      ₹{walletBalance.toLocaleString("en-IN")}
                    </p>
                  )}
                  {error && (
                    <p className="text-xs font-medium text-amber-700 mt-2 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {error}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-xl bg-electric/10 flex items-center justify-center">
                  <Wallet size={20} className="text-electric" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{
                    background: `${tierInfo.color}12`,
                    color: tierInfo.color,
                    border: `1px solid ${tierInfo.color}25`,
                  }}
                >
                  Tier {user.tier} · {tierInfo.name}
                </span>
                <span className="text-xs text-gray-500 font-medium">Zero-touch claim flow enabled</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard
                label="Weekly Premium"
                value={`₹${premium.toFixed(0)}`}
                icon={<Shield size={18} />}
                color="text-electric"
                bg="bg-electric/8"
              />
              <StatCard
                label="Total Claims"
                value={claims.length.toString()}
                icon={<FileText size={18} />}
                color="text-amber-600"
                bg="bg-amber-50"
              />
              <StatCard
                label="Approved"
                value={approvedClaims.toString()}
                icon={<CheckCircle2 size={18} />}
                color="text-teal-600"
                bg="bg-teal-50"
              />
            </div>

            {/* Zone & Coverage remaining */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="premium-card p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Zone</p>
                <p className="text-xl font-bold text-gray-800 capitalize">{user?.zone?.replace(/_/g, " ") ?? "—"}</p>
                <p className="text-xs text-gray-500 mt-1">Your active delivery area</p>
              </div>
              <div className="premium-card p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Coverage Left</p>
                <p className="text-xl font-bold text-teal-600 count-up">₹{coverageLeft.toLocaleString("en-IN")}</p>
                <p className="text-xs text-gray-500 mt-1">of ₹{maxCoverage.toLocaleString('en-IN')} this cycle</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => router.push("/reports")}
                className="premium-card p-5 flex items-center gap-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Report Disruption</p>
                  <p className="text-xs text-gray-500">Feed our consensus engine</p>
                </div>
                <ArrowUpRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </button>
              <button
                type="button"
                onClick={() => router.push("/weather")}
                className="premium-card p-5 flex items-center gap-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <CloudSun size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Weather Signals</p>
                  <p className="text-xs text-gray-500">Live oracle readings</p>
                </div>
                <ArrowUpRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </button>
            </div>

            {/* Payout History */}
            <div className="premium-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Auto Payout Ledger
                </h3>
                <TrendingUp size={14} className="text-gray-300" />
              </div>
              <div className="divide-y divide-gray-50">
                {loading ? (
                  <div className="px-5 py-8 space-y-3">
                    <div className="skeleton-light h-12 w-full rounded-xl" />
                    <div className="skeleton-light h-12 w-full rounded-xl" />
                  </div>
                ) : payouts.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-gray-500">
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
            {/* Policy snapshot */}
            <div className="premium-card p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Policy Status</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-sm font-semibold text-teal-600">Active</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Renews {new Date(nextRenewalAt).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}
              </p>
            </div>

            {/* Active Premium */}
            <div className="premium-card p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Active Premium</p>
              <p className="text-2xl font-extrabold tracking-tight text-gray-900">
                ₹{premium.toFixed(2)}<span className="text-sm font-normal text-gray-400"> /week</span>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                AI-priced for your zone and shift schedule. No manual claims required.
              </p>
            </div>

            {/* Covered Disruptions */}
            <div className="premium-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Covered Disruptions
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {COVERAGE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="px-5 py-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center`}>
                          <Icon size={13} style={{ color: item.color }} />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-teal-600 border border-teal-200 bg-teal-50 rounded-full px-2 py-0.5 font-semibold">
                        Active
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent claims */}
            <div className="premium-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Recent Claims</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {loading ? (
                  <div className="px-5 py-6 space-y-2">
                    <div className="skeleton-light h-8 w-full rounded-lg" />
                    <div className="skeleton-light h-8 w-full rounded-lg" />
                  </div>
                ) : claims.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-gray-500">No claims recorded yet.</p>
                  </div>
                ) : (
                  claims.slice(0, 3).map((claim) => (
                    <div key={`${claim.event_id}-${claim.created_at}`} className="px-5 py-3.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-800">
                          {claim.event_id.slice(0, 8)}...
                        </span>
                        <span className="flex items-center gap-1 text-[10px]">
                          {claim.status === "approved" ? (
                            <CheckCircle2 size={10} className="text-teal-500" />
                          ) : (
                            <Clock size={10} className="text-amber-500" />
                          )}
                          <span className="text-gray-400">{claim.status}</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400">
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

function parseMaxPayoutAmount(maxPayoutLabel: string): number {
  const digits = maxPayoutLabel.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

function isSettledPayout(status: string): boolean {
  const normalized = status.trim().toLowerCase();
  return normalized === "credited" || normalized === "succeeded";
}

function getCurrentCycleStart(reference = new Date()): Date {
  const start = new Date(reference);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getNextWeeklyRenewalIso(reference: Date): string {
  const next = new Date(reference);
  next.setHours(7, 0, 0, 0);
  const day = next.getDay();
  let daysUntilMonday = (8 - day) % 7;
  if (daysUntilMonday === 0) daysUntilMonday = 7;
  if (day === 1 && reference.getHours() < 7) daysUntilMonday = 0;
  next.setDate(next.getDate() + daysUntilMonday);
  return next.toISOString();
}

function StatCard({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <div className="premium-card p-5">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-xl font-bold tracking-tight text-gray-900 count-up">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function PayoutRow({ payout }: { payout: PayoutListItem }) {
  const d = new Date(payout.created_at);
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base font-bold text-gray-900">
            ₹{payout.amount.toFixed(2)}
          </span>
          {payout.status === "credited" || payout.status === "succeeded" ? (
            <CheckCircle2 size={12} className="text-teal-500" />
          ) : (
            <Clock size={12} className="text-amber-500" />
          )}
        </div>
        <p className="text-[10px] text-gray-400 truncate">
          Event: {payout.event_id.slice(0, 12)}...
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-[10px] text-gray-400 block">{date}</span>
        <span className="text-[10px] text-gray-300">{time}</span>
      </div>
    </div>
  );
}
