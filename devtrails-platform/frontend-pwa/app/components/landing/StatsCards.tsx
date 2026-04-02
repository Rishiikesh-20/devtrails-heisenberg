"use client";

import React, { useEffect, useRef } from "react";

const stats = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    value: "₹4,200",
    label: "Avg. Weekly Protection",
    bg: "bg-blue-50",
    trend: "+12%",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    value: "2.4 mins",
    label: "Avg. Payout Speed",
    bg: "bg-teal-50",
    trend: "Faster than ever",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    value: "98.2%",
    label: "Claim Success Rate",
    bg: "bg-violet-50",
    trend: "Industry leading",
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
    <section ref={sectionRef} className="pb-6 bg-background">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`reveal reveal-scale reveal-delay-${i + 1} premium-card p-6 flex items-start gap-5`}
            >
              <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-gray-900 tracking-tight leading-none mb-1">{stat.value}</p>
                <p className="text-xs text-gray-400 mb-2">{stat.label}</p>
                <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-medium">{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
