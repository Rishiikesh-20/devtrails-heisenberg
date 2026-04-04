"use client";

import React, { useState, useEffect } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      id="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-navy-500/95 backdrop-blur-xl shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-[72px]">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-electric flex items-center justify-center transition-transform group-hover:scale-105">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              WageLock
            </span>
          </a>

          {/* Nav Links — Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {["Home", "How It Works", "Protection", "Payouts", "Profile"].map(
              (item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white rounded-lg transition-colors hover:bg-white/5"
                >
                  {item}
                </a>
              ),
            )}
          </div>

          {/* Right — Auth Links */}
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden md:inline-flex text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </a>
            <a
              href="/onboarding"
              className="inline-flex items-center gap-1.5 bg-electric hover:bg-electric-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              id="nav-get-started"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
