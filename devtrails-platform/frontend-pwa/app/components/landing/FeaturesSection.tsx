"use client";

import React, { useEffect, useRef } from "react";

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    title: "Instant Payouts",
    description: "Funds reach your UPI account within minutes of a verified disruption. No waiting, no queues.",
    bg: "bg-blue-50",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    title: "AI Monitoring",
    description: "Our system watches your zone 24/7 — weather, road blocks, platform outages — all auto-detected.",
    bg: "bg-teal-50",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    title: "Unbreakable Security",
    description: "Bank-grade encryption and verified identity checks ensure every rupee goes to the right partner.",
    bg: "bg-violet-50",
  },
];

export function FeaturesSection() {
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
      { threshold: 0.1 }
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="section-spacing bg-white">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        {/* Header — Finpay style left-aligned */}
        <div className="reveal grid md:grid-cols-2 gap-8 items-end mb-14">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric mb-3">Platform Features</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
              Protection that grows<br />with your hustle.
            </h2>
          </div>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed md:text-right">
            WageLock runs silently in the background. You focus on deliveries — we make sure every disrupted shift gets compensated automatically.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`reveal reveal-scale reveal-delay-${i + 1} border border-gray-100 rounded-2xl p-7 group hover:border-gray-200 transition-colors`}
            >
              <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-5`}>
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
