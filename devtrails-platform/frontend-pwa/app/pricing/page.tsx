"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AIPricingCard } from "../components/onboarding/AIPricingCard";
import type { RegisterResponse } from "../lib/types";

const REGISTRATION_KEY = "wagelock.registration";

export default function PricingPage() {
  const router = useRouter();
  const [data] = useState<RegisterResponse | null>(() => {
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

  useEffect(() => {
    if (!data) {
      router.replace("/onboarding");
    }
  }, [data, router]);

  if (!data) {
    return (
      <main className="min-h-screen bg-background py-12 px-5">
        <div className="max-w-2xl mx-auto premium-card p-8 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-28 mb-4" />
          <div className="h-8 bg-gray-100 rounded w-3/4 mb-6" />
          <div className="h-40 bg-gray-100 rounded" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-5">
      <div className="max-w-2xl mx-auto mb-5">
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric mb-2">
          Pricing Confirmation
        </p>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Your AI Premium Is Ready
        </h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <AIPricingCard
          pricing={data.pricing_breakdown}
          tier={data.tier}
          onAccept={() => router.push("/dashboard")}
        />
      </div>
    </main>
  );
}
