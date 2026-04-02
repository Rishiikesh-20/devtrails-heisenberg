"use client";

import React, { useEffect, useRef } from "react";

export function LiveRiskCard() {
  const coverage = 80;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (coverage / 100) * circumference;
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
      { threshold: 0.12 }
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="protection" ref={sectionRef} className="section-spacing bg-background">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Main risk card */}
          <div className="reveal reveal-scale md:col-span-2 premium-card p-7 md:p-8 flex flex-col md:flex-row gap-7 md:gap-10 items-start md:items-center">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">Live Risk Status</p>
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"/>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"/>
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">Chennai - T Nagar</h3>
                </div>
              </div>

              {/* Risk bar */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs text-gray-400 shrink-0 w-16">Risk Level</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-amber-400 to-red-400 transition-all duration-700"/>
                </div>
                <span className="badge-danger text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0">HIGH</span>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed">
                Heavy rain expected. Automatic compensation active for all partners in this zone.
              </p>
            </div>

            {/* Circular progress */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative w-[120px] h-[120px]">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="8"/>
                  <circle
                    cx="60" cy="60" r={radius}
                    fill="none" stroke="#2563EB" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 leading-none">{coverage}%</span>
                  <span className="text-[9px] uppercase tracking-widest font-medium text-gray-400 mt-1">Coverage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Worker Impact */}
          <div
            className="reveal reveal-scale reveal-delay-2 rounded-2xl p-7 md:p-8 flex flex-col justify-between"
            style={{ background: "linear-gradient(145deg, #1E40AF 0%, #2563EB 100%)" }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-white/50 mb-3">Worker Impact</p>
              <h3 className="text-4xl font-bold text-white mb-3 tracking-tight">12,500+</h3>
              <p className="text-sm text-white/60 leading-relaxed">
                Active delivery partners protected this week across 14 cities.
              </p>
            </div>
            <a
              href="#"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white transition-colors w-fit group"
              id="view-network-data"
            >
              View Network Data
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
