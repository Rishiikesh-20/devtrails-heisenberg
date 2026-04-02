"use client";

import React, { useEffect, useRef } from "react";

const steps = [
  {
    number: "01",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    title: "Choose Your Plan",
    description: "Pick a weekly protection level that fits your goals and set your delivery zone in seconds.",
    accent: "#2563EB",
    iconBg: "bg-blue-50",
  },
  {
    number: "02",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    title: "We Keep Watch",
    description: "We monitor the weather, severe traffic, and delivery app status in your zone 24/7.",
    accent: "#14B8A6",
    iconBg: "bg-teal-50",
  },
  {
    number: "03",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    title: "Disruption Happens",
    description: "When heavy rain or app outages hit your area, our system instantly detects the problem.",
    accent: "#F59E0B",
    iconBg: "bg-amber-50",
  },
  {
    number: "04",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    title: "Automatic Check",
    description: "You never have to file a claim. We securely verify your location and active shift status behind the scenes.",
    accent: "#8B5CF6",
    iconBg: "bg-violet-50",
  },
  {
    number: "05",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    title: "Instant Approval",
    description: "If the disruption qualifies, our smart system approves your payout instantly without human review.",
    accent: "#EC4899",
    iconBg: "bg-pink-50",
  },
  {
    number: "06",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    title: "Money in Your Bank",
    description: "Compensation lands directly in your UPI account in under 10 minutes. Fast, smooth, and hassle-free.",
    accent: "#059669",
    iconBg: "bg-emerald-50",
  },
];

function StepCard({ step, delay }: { step: typeof steps[0]; delay: number }) {
  return (
    <div className={`reveal reveal-scale reveal-delay-${delay} flex flex-col`}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center shrink-0 border border-white shadow-sm`}
        >
          {step.icon}
        </div>
        <span
          className="text-4xl font-black tracking-tighter opacity-[0.12]"
          style={{ color: step.accent }}
        >
          {step.number}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{step.title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{step.description}</p>
    </div>
  );
}

export function HowItWorks() {
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
    <section id="how-it-works" ref={sectionRef} className="section-spacing bg-white">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        {/* Header */}
        <div className="reveal mb-14">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric mb-3">The Process</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight max-w-xs">
              How WageLock Works
            </h2>
            <p className="text-gray-400 text-sm max-w-xs md:text-right">
              Simple, automatic protection that works in the background while you focus on deliveries
            </p>
          </div>
          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>

        {/* Row 1 — Steps 01, 02, 03 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-7 left-[32px] right-[calc(20%)] h-px border-t border-dashed border-gray-200 pointer-events-none" />
          {steps.slice(0, 3).map((step, i) => (
            <StepCard key={step.number} step={step} delay={i + 1} />
          ))}
        </div>

        {/* Row connector */}
        <div className="flex justify-center py-5">
          <div className="flex flex-col items-center">
            <div className="h-7 w-px border-l border-dashed border-gray-300" />
            <svg className="mt-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </div>
        </div>

        {/* Row 2 — Steps 04, 05, 06 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-7 left-[32px] right-[calc(20%)] h-px border-t border-dashed border-gray-200 pointer-events-none" />
          {steps.slice(3, 6).map((step, i) => (
            <StepCard key={step.number} step={step} delay={i + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
