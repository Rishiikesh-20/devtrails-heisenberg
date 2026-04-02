"use client";

import React, { useEffect, useRef } from "react";

const stats = [
  {
    value: "₹4,200",
    label: "Average weekly protection",
    sub: "Per active delivery partner",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    bg: "bg-blue-50",
  },
  {
    value: "2.4 mins",
    label: "Average payout speed",
    sub: "From trigger to UPI credit",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    bg: "bg-teal-50",
  },
  {
    value: "98.2%",
    label: "Claim success rate",
    sub: "Industry-leading accuracy",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    bg: "bg-violet-50",
  },
];

export function StatsCards() {
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
    <section ref={sectionRef} className="py-16 md:py-20 bg-background">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        {/* Section label — Finpay style */}
        <div className="reveal mb-10">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric mb-3">By the numbers</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Why partners prefer WageLock</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`reveal reveal-scale reveal-delay-${i + 1} bg-white border border-gray-100 rounded-2xl p-7`}
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-6`}>
                {stat.icon}
              </div>
              {/* Big number like Finpay's 3k+ / 24% */}
              <p className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-none mb-2">{stat.value}</p>
              <p className="text-sm font-semibold text-gray-700 mb-1">{stat.label}</p>
              <p className="text-xs text-gray-400">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
