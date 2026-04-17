"use client";

import React, { useEffect, useRef } from "react";
import { CheckCircle, Shield, Zap, Star } from "lucide-react";
import Link from "next/link";

const TIERS = [
  {
    id: 1,
    name: "Basic Shield",
    price: "₹79",
    maxPayout: "₹500",
    dailyCap: "₹150",
    color: "#2563EB",
    bg: "bg-blue-50",
    border: "border-blue-100",
    icon: Shield,
    features: [
      "Heavy rain coverage (1.0x severity)",
      "Platform outage protection",
      "UPI payout within 10 minutes",
      "48-hour activation period",
    ],
    cta: "Get Basic",
    popular: false,
  },
  {
    id: 2,
    name: "Pro Guard",
    price: "₹129",
    maxPayout: "₹1,200",
    dailyCap: "₹350",
    color: "#8B5CF6",
    bg: "bg-violet-50",
    border: "border-violet-100",
    icon: Zap,
    features: [
      "All Basic Shield coverage",
      "Curfew / Section 144 (1.2× severity)",
      "Festival traffic disruption (0.5×)",
      "Priority AI verification queue",
    ],
    cta: "Get Pro",
    popular: true,
  },
  {
    id: 3,
    name: "Elite Armor",
    price: "₹179",
    maxPayout: "₹2,500",
    dailyCap: "₹700",
    color: "#F59E0B",
    bg: "bg-amber-50",
    border: "border-amber-100",
    icon: Star,
    features: [
      "All Pro Guard coverage",
      "Fuel & LPG shortage (0.65x severity)",
      "Multi-event stacking protection",
      "Dedicated support queue",
    ],
    cta: "Get Elite",
    popular: false,
  },
];

export function PricingTiersSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const items = section.querySelectorAll(".reveal, .reveal-scale");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("is-visible"); observer.unobserve(e.target); }
        });
      },
      { threshold: 0.08 }
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="protection" ref={sectionRef} className="section-spacing bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        {/* Header */}
        <div className="reveal text-center mb-14">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric mb-3">Pricing</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-4">
            Pick the protection that fits.<br />Pay just ₹79 a week.
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            AI-priced weekly premiums. No lock-ins. Cancel anytime. Payouts land in your UPI in under 10 minutes.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {TIERS.map((tier, i) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={`reveal reveal-scale reveal-delay-${i + 1} relative border rounded-2xl p-7 transition-all hover:-translate-y-1 hover:shadow-card-hover ${
                  tier.popular
                    ? "border-violet-200 bg-white shadow-lg"
                    : "border-gray-100 bg-white shadow-card"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                {/* Icon + name */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-10 h-10 rounded-xl ${tier.bg} border ${tier.border} flex items-center justify-center`}
                  >
                    <Icon size={18} style={{ color: tier.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: tier.color }}>
                      Tier {tier.id}
                    </p>
                    <p className="text-sm font-bold text-gray-900">{tier.name}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <span className="text-3xl font-extrabold text-gray-900">{tier.price}</span>
                  <span className="text-sm text-gray-400 ml-1">/week</span>
                  <div className="flex items-center gap-4 mt-2">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Max Payout</p>
                      <p className="text-sm font-bold text-gray-800">{tier.maxPayout}</p>
                    </div>
                    <div className="h-6 w-px bg-gray-100" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Daily Cap</p>
                      <p className="text-sm font-bold text-gray-800">{tier.dailyCap}</p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle size={14} className="shrink-0 mt-0.5" style={{ color: tier.color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/onboarding"
                  id={`tier-${tier.id}-cta`}
                  className="block w-full text-center font-semibold text-sm py-3 rounded-xl transition-all"
                  style={
                    tier.popular
                      ? { background: tier.color, color: "#fff" }
                      : { background: `${tier.color}12`, color: tier.color, border: `1px solid ${tier.color}25` }
                  }
                >
                  {tier.cta} →
                </Link>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-8">
          All tiers include a 48-hour waiting period · 20% co-pay applies · Auto-renews weekly · Cancel anytime
        </p>
      </div>
    </section>
  );
}
