"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, Zap } from "lucide-react";
import { useToast } from "../components/ui/ToastProvider";
import { apiPost, getSignupDraft, setUser, setOnboarding } from "../lib/api";
import { ZONES } from "../lib/constants";
import type { OnboardingPayload, RegisterResponse } from "../lib/types";

const initialState: OnboardingPayload = {
  email: "",
  full_name: "",
  zone: "south_delhi",
  shift_start: "09:00",
  shift_end: "17:00",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [form, setForm] = useState<OnboardingPayload>(initialState);
  const [loading, setLoading] = useState(false);

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

  const onChange = (field: keyof OnboardingPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    <main className="min-h-screen bg-background py-12 px-5">
      <div className="max-w-2xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/signup"
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={16} className="text-gray-600" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    step <= 2 ? "bg-electric" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-400">
              Step 2 of 3
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric mb-2">
            Zero-Touch Onboarding
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Protect My Income
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Tell us your shift details and delivery zone. Our AI will calculate your personalized premium.
          </p>
        </div>

        <section className="premium-card p-6 md:p-8">
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label htmlFor="ob-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="ob-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric"
                placeholder="worker@test.com"
              />
            </div>

            <div>
              <label htmlFor="ob-name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="ob-name"
                type="text"
                required
                value={form.full_name}
                onChange={(e) => onChange("full_name", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric"
                placeholder="Raju Delivery"
              />
            </div>

            <div>
              <label htmlFor="ob-zone" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <MapPin size={14} className="text-electric" />
                Delivery Zone
              </label>
              <select
                id="ob-zone"
                required
                value={form.zone}
                onChange={(e) => onChange("zone", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric bg-white"
              >
                {ZONES.map((z) => (
                  <option key={z.value} value={z.value}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ob-shift-start" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <Clock size={14} className="text-electric" />
                  Shift Start
                </label>
                <input
                  id="ob-shift-start"
                  type="time"
                  required
                  value={form.shift_start}
                  onChange={(e) => onChange("shift_start", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric"
                />
              </div>
              <div>
                <label htmlFor="ob-shift-end" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <Clock size={14} className="text-electric" />
                  Shift End
                </label>
                <input
                  id="ob-shift-end"
                  type="time"
                  required
                  value={form.shift_end}
                  onChange={(e) => onChange("shift_end", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
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
        </section>
      </div>
    </main>
  );
}
