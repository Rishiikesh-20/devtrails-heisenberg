import React from "react";

export function Footer() {
  return (
    <footer className="bg-navy py-10">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-electric flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-white/80 font-semibold text-sm">WageLock</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "Support", "Contact"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-white/40 hover:text-white/70 text-xs font-medium transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} WageLock. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
