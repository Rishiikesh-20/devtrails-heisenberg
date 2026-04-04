"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import type { OnboardingPayload, RegisterResponse } from "../lib/types";

const REGISTRATION_KEY = "wagelock.registration";
const ONBOARDING_KEY = "wagelock.onboarding";

const initialState: OnboardingPayload = {
  email: "",
  full_name: "",
  zone: "south_delhi",
  shift_start: "09:00",
  shift_end: "17:00",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState<OnboardingPayload>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChange = (field: keyof OnboardingPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/v1/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as
        | RegisterResponse
        | { error?: string; details?: string };
      if (!response.ok) {
        const errMsg =
          "error" in payload && payload.error
            ? payload.error
            : "Registration failed";
        const details =
          "details" in payload && payload.details
            ? ` (${payload.details})`
            : "";
        throw new Error(`${errMsg}${details}`);
      }

      sessionStorage.setItem(REGISTRATION_KEY, JSON.stringify(payload));
      sessionStorage.setItem(ONBOARDING_KEY, JSON.stringify(form));
      router.push("/pricing");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process onboarding now.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background py-12 px-5">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric mb-2">
            Zero-Touch Onboarding
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Protect My Income
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            One quick form, then AI pricing, then your wallet goes live.
          </p>
        </div>

        <section className="premium-card p-6 md:p-8">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label
                htmlFor="ob-email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
              <label
                htmlFor="ob-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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
              <label
                htmlFor="ob-zone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Zone
              </label>
              <input
                id="ob-zone"
                type="text"
                required
                value={form.zone}
                onChange={(e) => onChange("zone", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric"
                placeholder="south_delhi"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="ob-shift-start"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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
                <label
                  htmlFor="ob-shift-end"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
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

            {error ? <p className="text-sm text-danger-600">{error}</p> : null}

            <button
              type="submit"
              className="w-full btn-primary disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Running AI Pricing..." : "Run AI Risk Pricing"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
