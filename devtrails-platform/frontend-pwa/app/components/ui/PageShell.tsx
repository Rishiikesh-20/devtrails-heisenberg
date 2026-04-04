"use client";

import React, { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CloudSun,
  BadgeCheck,
  User,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { getUser, getOnboarding, clearSession } from "../../lib/api";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/policy", label: "Policy", icon: BadgeCheck },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/weather", label: "Signals", icon: CloudSun },
  { href: "/profile", label: "Profile", icon: User },
];

export function PageShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = getUser();
  const onboarding = getOnboarding();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const userName = onboarding?.full_name ?? "Delivery Partner";
  const userZone = user?.zone ?? onboarding?.zone ?? "—";
  const userTier = user?.tier ?? 0;

  const handleLogout = () => {
    clearSession();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#08172c] text-white flex flex-col">
      {/* ── Top Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#08172c]/95 backdrop-blur-xl border-b border-white/6">
        <div className="max-w-7xl mx-auto px-5 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-electric flex items-center justify-center transition-transform group-hover:scale-105">
              <Shield size={16} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="font-bold text-white text-base tracking-tight hidden sm:inline">
              WageLock
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/8 text-white"
                      : "text-white/50 hover:text-white hover:bg-white/4"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-[11px] text-white/40 mt-0.5">
                {userZone}{userTier > 0 ? ` · Tier ${userTier}` : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-white hover:bg-white/6 transition-colors"
            >
              <LogOut size={14} strokeWidth={1.8} />
              Logout
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-white/6"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/6 bg-[#0a1d33]/98 backdrop-blur-xl animate-fade-in">
            <div className="px-5 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-electric/10 text-electric"
                        : "text-white/60 hover:text-white hover:bg-white/4"
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors w-full"
              >
                <LogOut size={18} strokeWidth={1.8} />
                Log Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Content ────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── Mobile bottom nav ──────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08172c]/95 backdrop-blur-xl border-t border-white/6">
        <div className="grid grid-cols-5 h-16">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  isActive ? "text-electric" : "text-white/35 hover:text-white/60"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
