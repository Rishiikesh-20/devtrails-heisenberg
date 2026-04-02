"use client";

import React, { useEffect, useRef } from "react";

const steps = [
  {
    number: "01",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    title: "Activate Weekly Protection",
    description: "Choose your protection level for the upcoming week based on your expected working hours.",
    accent: "text-electric",
    dot: "bg-electric",
    iconBg: "bg-blue-50",
  },
  {
    number: "02",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    title: "System Monitors Disruptions",
    description: "Our AI tracks weather, traffic spikes, and platform downtime in real-time within your active zones.",
    accent: "text-teal-600",
    dot: "bg-teal-500",
    iconBg: "bg-teal-50",
  },
  {
    number: "03",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
    title: "Automatic Payout",
    description: "When disruptions occur, funds are transferred instantly via UPI without you filing any forms.",
    accent: "text-violet-600",
    dot: "bg-violet-500",
    iconBg: "bg-violet-50",
  },
];

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
      { threshold: 0.1 }
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
          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"/>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting line on desktop */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-px border-t border-dashed border-gray-200"/>

          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`reveal reveal-scale reveal-delay-${i + 1} flex flex-col`}
            >
              {/* Icon + step number */}
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-16 h-16 rounded-2xl ${step.iconBg} flex items-center justify-center shrink-0 border border-white shadow-sm`}>
                  {step.icon}
                </div>
                <span className={`text-4xl font-black ${step.accent} opacity-20 tracking-tighter`}>{step.number}</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
