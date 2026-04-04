"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  MapPin,
  Clock,
  Shield,
  Wallet,
  ChevronRight,
  Zap,
  LogOut,
} from "lucide-react";
import { PageShell } from "../components/ui/PageShell";
import { useToast } from "../components/ui/ToastProvider";
import { getUser, getOnboarding, clearSession, apiGet } from "../lib/api";
import { TIER_INFO, ZONES } from "../lib/constants";
import type { WalletResponse } from "../lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [user, setUserState] = useState<any>(null);
  const [onboarding, setOnboardingState] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    const o = getOnboarding();
    setUserState(u);
    setOnboardingState(o);
    setMounted(true);

    if (!u) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();
    apiGet<WalletResponse>(
      `/wallet?user_id=${encodeURIComponent(u.id)}`,
      controller.signal,
    )
      .then((data) => setWalletBalance(data.balance ?? 0))
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [router]);

  if (!mounted) return null;
  if (!user) return null;

  const tier = TIER_INFO[user.tier] ?? TIER_INFO[3];
  const zoneName =
    ZONES.find((z) => z.value === user.zone)?.label ?? user.zone;
  const premium =
    user.pricing_breakdown?.final_premium ?? user.weekly_premium ?? 0;

  const handleLogout = () => {
    clearSession();
    addToast("Logged out successfully", "info");
    setTimeout(() => (window.location.href = "/"), 300);
  };

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-6">
        {/* ── Header ──────────────────────────────── */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric mb-2">
            Your Account
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        </div>

        {/* ── User Info Card ──────────────────────── */}
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-electric/15 flex items-center justify-center">
              <User size={24} strokeWidth={1.5} className="text-electric" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {onboarding?.full_name ?? "Delivery Partner"}
              </h2>
              <p className="text-sm text-white/50 flex items-center gap-1.5 mt-0.5">
                <Mail size={12} strokeWidth={1.5} />
                {user.email}
              </p>
            </div>
          </div>

          <div className="h-px bg-white/[0.06]" />

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={<MapPin size={16} />} label="Zone" value={zoneName} />
            <InfoRow
              icon={<Clock size={16} />}
              label="Shift"
              value={`${onboarding?.shift_start ?? "—"} — ${onboarding?.shift_end ?? "—"}`}
            />
            <InfoRow
              icon={<Shield size={16} />}
              label="Risk Tier"
              value={
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tier.color }}
                  />
                  Tier {user.tier} — {tier.name}
                </span>
              }
            />
            <InfoRow
              icon={<Zap size={16} />}
              label="Max Payout"
              value={tier.maxPayout}
            />
          </div>
        </div>

        {/* ── Premium Card ─────────────────────────── */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
                Weekly Premium
              </p>
              <p className="text-3xl font-extrabold tracking-tight count-up">
                ₹{premium.toFixed(2)}
              </p>
              <p className="text-xs text-white/40 mt-1">
                AI-priced for your zone & shift schedule
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-electric/10 flex items-center justify-center">
              <Shield size={22} className="text-electric" />
            </div>
          </div>

          {user.pricing_breakdown?.reason && (
            <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                AI Reasoning
              </p>
              <p className="text-sm text-white/70 leading-relaxed">
                {user.pricing_breakdown.reason}
              </p>
            </div>
          )}
        </div>

        {/* ── Wallet Card ──────────────────────────── */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">
                Wallet Balance
              </p>
              {loading ? (
                <div className="skeleton h-8 w-32 mt-1" />
              ) : (
                <p className="text-3xl font-extrabold tracking-tight count-up">
                  ₹{walletBalance.toLocaleString("en-IN")}
                </p>
              )}
            </div>
            <Wallet size={22} className="text-teal-400" />
          </div>
        </div>

        {/* ── Actions ──────────────────────────────── */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full glass-card rounded-xl px-5 py-4 flex items-center justify-between hover:bg-white/[0.06] transition-colors"
          >
            <span className="text-sm font-medium">Go to Dashboard</span>
            <ChevronRight size={16} className="text-white/30" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl px-5 py-4 flex items-center justify-between text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/10"
          >
            <span className="text-sm font-medium flex items-center gap-2">
              <LogOut size={16} />
              Log Out
            </span>
            <ChevronRight size={16} className="opacity-30" />
          </button>
        </div>
      </div>
    </PageShell>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-white/30">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-white/40">
          {label}
        </p>
        <p className="text-sm font-medium text-white/80 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
