"use client";

import React, { useEffect, useRef } from "react";

const indicators = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    label: "Instant UPI payouts",
    sub: "Direct to your bank",
    bg: "bg-teal-50",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
    label: "No claim forms",
    sub: "Zero paperwork ever",
    bg: "bg-blue-50",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    label: "AI-based verification",
    sub: "Real-time event checks",
    bg: "bg-violet-50",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    label: "24/7 Support",
    sub: "Guardian team always on",
    bg: "bg-amber-50",
  },
];

export function TrustIndicators() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const items = section.querySelectorAll(".reveal, .reveal-scale");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-10 bg-white border-t border-gray-50">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="reveal mb-8 flex items-center gap-4">
          <h3 className="text-sm font-semibold text-gray-700 shrink-0">Why partners trust WageLock</h3>
          <div className="flex-1 h-px bg-gray-100"/>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {indicators.map((item, i) => (
            <div
              key={item.label}
              className={`reveal reveal-scale reveal-delay-${i + 1} flex items-start gap-3 p-4 rounded-xl bg-gray-50/60 border border-gray-100`}
            >
              <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 leading-tight">{item.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
