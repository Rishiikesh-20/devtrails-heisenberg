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
import { getUser, clearSession, apiGet, setUser } from "../lib/api";
import { TIER_INFO, ZONES } from "../lib/constants";
import type { ProfileResponse, WalletResponse } from "../lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionUser = getUser();

    if (!sessionUser) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();
    Promise.allSettled([
      apiGet<ProfileResponse>(`/api/v1/profile?user_id=${encodeURIComponent(sessionUser.id)}`, controller.signal),
      apiGet<WalletResponse>(`/wallet?user_id=${encodeURIComponent(sessionUser.id)}`, controller.signal),
    ])
      .then(([profileResult, walletResult]) => {
        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value);
          setUser(profileResult.value);
        } else {
          setProfile(sessionUser as ProfileResponse);
        }
        if (walletResult.status === "fulfilled") {
          setWalletBalance(walletResult.value.balance ?? 0);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [router]);

  if (!profile) return null;

  const tier = TIER_INFO[profile.tier as 1 | 2 | 3] ?? TIER_INFO[3];
  const zoneName = ZONES.find((z) => z.value === profile.zone)?.label ?? profile.zone;
  const premium = profile.pricing_breakdown?.final_premium ?? profile.weekly_premium ?? 0;

  const handleLogout = () => {
    clearSession();
    addToast("Logged out successfully", "info");
    setTimeout(() => (window.location.href = "/"), 300);
  };

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-6">
        {/* Header */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric mb-2">
            Your Account
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile</h1>
        </div>

        {/* User Info Card */}
        <div className="premium-card p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-electric/8 flex items-center justify-center">
              <User size={24} strokeWidth={1.5} className="text-electric" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {profile.full_name || "Delivery Partner"}
              </h2>
              <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
                <Mail size={12} strokeWidth={1.5} />
                {profile.email}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={<MapPin size={16} />} label="Zone" value={zoneName} />
            <InfoRow
              icon={<Clock size={16} />}
              label="Shift"
              value={`${profile.shift_start ?? "—"} — ${profile.shift_end ?? "—"}`}
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
                  Tier {profile.tier} — {tier.name}
                </span>
              }
            />
            <InfoRow
              icon={<Zap size={16} />}
              label="Max Payout"
              value={tier.maxPayout}
            />
            <InfoRow
              icon={<Shield size={16} />}
              label="Policy"
              value={profile.policy_status ? profile.policy_status.toUpperCase() : "PENDING"}
            />
            <InfoRow
              icon={<Shield size={16} />}
              label="Policy Number"
              value={profile.policy_number ?? "Generating..."}
            />
          </div>
        </div>

        {/* Premium Card */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">
                Weekly Premium
              </p>
              <p className="text-3xl font-extrabold tracking-tight text-gray-900 count-up">
                ₹{premium.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                AI-priced for your zone &amp; shift schedule
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-electric/8 flex items-center justify-center">
              <Shield size={22} className="text-electric" />
            </div>
          </div>

          {profile.pricing_breakdown?.reason && (
            <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">AI Reasoning</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {profile.pricing_breakdown.reason}
              </p>
            </div>
          )}
        </div>

        {/* Wallet Card */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">
                Wallet Balance
              </p>
              {loading ? (
                <div className="skeleton-light h-8 w-32 mt-1 rounded-xl" />
              ) : (
                <p className="text-3xl font-extrabold tracking-tight text-gray-900 count-up">
                  ₹{walletBalance.toLocaleString("en-IN")}
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
              <Wallet size={22} className="text-teal-600" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full premium-card px-5 py-4 flex items-center justify-between hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
          >
            <span className="text-sm font-medium text-gray-800">Go to Dashboard</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl px-5 py-4 flex items-center justify-between text-red-500 hover:bg-red-50 transition-colors border border-red-100 bg-white"
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
      <div className="mt-0.5 text-gray-400">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
