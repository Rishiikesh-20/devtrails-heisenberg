"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, Zap, Shield, CheckCircle } from "lucide-react";
import { useToast } from "../components/ui/ToastProvider";
import { apiPost, getSignupDraft, setUser, setOnboarding } from "../lib/api";
import { DEFAULT_ZONE, getZoneByValue, nearestZoneFromCoordinates } from "../lib/constants";
import type { OnboardingPayload, RegisterResponse } from "../lib/types";

const initialState: OnboardingPayload = {
  email: "",
  full_name: "",
	zone: DEFAULT_ZONE,
  shift_start: "09:00",
  shift_end: "17:00",
};

const TRUST_POINTS = [
  "AI calculates your personal risk score",
  "48-hour activation, then always-on coverage",
  "No claim filing — payouts are fully automatic",
];

function displayZone(zone: string): string {
  const normalized = zone.trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  const known = getZoneByValue(normalized);
  if (known.value === normalized) {
    return known.label;
  }

  return normalized.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function OnboardingPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [form, setForm] = useState<OnboardingPayload>(initialState);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const draft = getSignupDraft();
    if (!draft) return;
    const fullName = `${draft.first_name ?? ""} ${draft.last_name ?? ""}`.trim();
    setForm((prev) => ({
      ...prev,
      email: draft.email || prev.email,
      full_name: fullName || prev.full_name,
    }));
  }, []);

  const detectLocation = React.useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not available on this device. Enter your zone manually.");
      return;
    }

    setDetectingLocation(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = nearestZoneFromCoordinates(
          position.coords.latitude,
          position.coords.longitude,
        );
        setForm((prev) => ({ ...prev, zone: nearest.value }));
        setDetectingLocation(false);
      },
      (error) => {
        setDetectingLocation(false);
        setLocationError(`Unable to detect location (${error.message}). Enter your zone manually.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const onChange = (field: keyof OnboardingPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.zone.trim()) {
      addToast("Delivery zone is required before continuing.", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost<RegisterResponse>("/api/v1/register", form);
      setUser(res);
      setOnboarding(form);
      sessionStorage.removeItem("wagelock.signup-draft");
      addToast("AI pricing complete! Review your premium.", "success");
      router.push("/pricing");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Unable to process onboarding now.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* ── Left: Info Panel (desktop) */}
      <div className="hidden lg:flex flex-col justify-center flex-1 px-14 py-16 bg-white border-r border-gray-100">
        <Link href="/" className="flex items-center gap-2.5 mb-12 w-fit">
          <div className="w-9 h-9 rounded-xl bg-electric flex items-center justify-center">
            <Shield size={18} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-base">WageLock</span>
        </Link>

        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric mb-4">
          Zero-Touch Onboarding
        </p>
        <h2 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
          Your income protection<br />starts here.
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-8">
          Tell us your shift details and delivery zone. Our AI will calculate your personalized premium in seconds.
        </p>

        <div className="space-y-3">
          {TRUST_POINTS.map((point) => (
            <div key={point} className="flex items-start gap-3">
              <CheckCircle size={16} className="text-teal-500 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-700">{point}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-gray-50 border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Waiting Period</p>
          <p className="text-sm font-bold text-gray-900">48 hours</p>
          <p className="text-xs text-gray-500 mt-1">
            After activation, your policy covers all future disruptions — with zero paperwork required.
          </p>
        </div>
      </div>

      {/* ── Right: Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[#F8FAFC]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-8 w-fit lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-electric flex items-center justify-center">
              <Shield size={18} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base">WageLock</span>
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            <Link
              href="/signup"
              className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
            >
              <ArrowLeft size={16} className="text-gray-600" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      step <= 2 ? "bg-electric" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-gray-400">
                Step 2 of 3 — Profile Setup
              </p>
            </div>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Protect My Income</h1>
            <p className="text-sm text-gray-500 mt-1.5">
				Use your live location and shift details. Our AI handles the rest.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label htmlFor="ob-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="ob-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric transition-all placeholder-gray-400"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="ob-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  id="ob-name"
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => onChange("full_name", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric transition-all placeholder-gray-400"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="ob-zone" className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} className="text-electric" />
                  Delivery Zone (GPS)
                </label>
                <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-900">
					{form.zone ? displayZone(form.zone) : "Detecting your area..."}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Premium and signals are scoped to this detected location.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  <MapPin size={12} className="text-electric" />
                  {detectingLocation ? "Detecting current location..." : "Use Current Location"}
                </button>

                <label htmlFor="ob-zone" className="block text-xs font-semibold text-gray-500 mt-3 mb-1.5">
                  If GPS is unavailable, enter your city or zone
                </label>
                <input
                  id="ob-zone"
                  type="text"
                  value={form.zone}
                  onChange={(e) => onChange("zone", e.target.value.trim().toLowerCase().replace(/\s+/g, "_"))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric transition-all placeholder-gray-400"
                  placeholder="coimbatore"
                />
                {locationError && <p className="text-xs text-amber-700 mt-2">{locationError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ob-shift-start" className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Clock size={14} className="text-electric" />
                    Shift Start
                  </label>
                  <input
                    id="ob-shift-start"
                    type="time"
                    required
                    value={form.shift_start}
                    onChange={(e) => onChange("shift_start", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="ob-shift-end" className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Clock size={14} className="text-electric" />
                    Shift End
                  </label>
                  <input
                    id="ob-shift-end"
                    type="time"
                    required
                    value={form.shift_end}
                    onChange={(e) => onChange("shift_end", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-electric hover:bg-electric-600 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  "Running AI Pricing..."
                ) : (
                  <>
                    <Zap size={16} />
                    Run AI Risk Pricing
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
