"use client";

import React, { useEffect, useRef } from "react";

export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const items = section.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add("is-visible"); observer.unobserve(e.target); }
        });
      },
      { threshold: 0.2 }
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-12 md:py-16 bg-white">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div
          className="reveal rounded-3xl px-8 md:px-16 py-14 md:py-20 overflow-hidden relative"
          style={{ background: "linear-gradient(145deg, #0B1F3A 0%, #0F2847 60%, #132F52 100%)" }}
        >
          {/* Subtle glow blobs — minimal, not flashy */}
          <div className="absolute top-0 left-0 w-80 h-80 bg-electric/8 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"/>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"/>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-lg">
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-white/40 mb-4">Get Started</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug mb-4">
                Ready to lock in your<br className="hidden md:block"/> income stability?
              </h2>
              <p className="text-white/40 text-sm leading-relaxed">
                Join 12,000+ partners who don&apos;t worry about rain or road closures anymore.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 bg-electric hover:bg-electric-600 text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition-colors whitespace-nowrap"
                id="cta-create-account"
              >
                Create Your Guardian Account
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center text-white/50 hover:text-white/80 text-sm font-medium transition-colors"
              >
                Learn how it works
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
