"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";
import { isLoggedIn } from "../../lib/api";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn] = useState(() => isLoggedIn());
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-electric flex items-center justify-center transition-transform group-hover:scale-105">
              <Shield size={16} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              WageLock
            </span>
          </Link>

          {/* Nav Links — Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {["Home", "How It Works", "Protection", "Payouts"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white rounded-lg transition-colors hover:bg-white/5"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Right — Auth Links */}
          <div className="hidden md:flex items-center gap-3">
            {loggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 bg-electric hover:bg-electric-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                id="nav-go-dashboard"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 bg-electric hover:bg-electric-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  id="nav-get-started"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.08]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} className="text-white" /> : <Menu size={18} className="text-white" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/[0.08] pb-5 pt-3 space-y-1">
            {["Home", "How It Works", "Protection", "Payouts"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white rounded-lg transition-colors"
              >
                {item}
              </a>
            ))}
            <div className="pt-3 border-t border-white/[0.06] space-y-2 px-2">
              {loggedIn ? (
                <Link
                  href="/dashboard"
                  className="block w-full text-center bg-electric text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block w-full text-center text-sm text-white/60 hover:text-white py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="block w-full text-center bg-electric text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
