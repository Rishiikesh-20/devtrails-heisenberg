"use client";

import React, { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CloudSun,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  Wallet,
  Radio,
  MapPin,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import { getUser, getOnboarding, clearSession } from "../../lib/api";
import { Footer } from "../landing/Footer";

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/payouts", label: "Payouts", icon: Wallet },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/weather", label: "Signals", icon: CloudSun },
];

const SECONDARY_NAV = [
  { href: "/triggers", label: "Signal Hub", icon: Radio },
  { href: "/signals-map", label: "Signals Map", icon: MapPin },
];

const ADMIN_NAV = [
  { href: "/admin", label: "Admin", icon: ShieldAlert },
];

const MOBILE_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/payouts", label: "Payouts", icon: Wallet },
  { href: "/signals-map", label: "Map", icon: MapPin },
  { href: "/profile", label: "Profile", icon: User },
];

export function PageShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = getUser();
  const onboarding = getOnboarding();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);

  const userName = onboarding?.full_name ?? "Delivery Partner";
  const userZone = user?.zone ?? onboarding?.zone ?? "—";
  const userTier = user?.tier ?? 0;
  const secondaryNav = user?.role === "admin" ? [...SECONDARY_NAV, ...ADMIN_NAV] : SECONDARY_NAV;

  const handleLogout = () => {
    clearSession();
    window.location.href = "/";
  };

  const isSecondaryActive = secondaryNav.some((item) => item.href === pathname);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 flex flex-col relative">

      {/* ── Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        {/* ── Thin Premium Gradient Accent Bar ── */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-electric via-[#3B82F6] to-[#14B8A6]" />

        <div className="max-w-7xl mx-auto px-5 flex items-center justify-between h-16 pt-1">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-electric flex items-center justify-center transition-transform group-hover:scale-105">
              <Shield size={16} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight hidden sm:inline">
              WageLock
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-electric/10 text-electric"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              );
            })}

            {/* More dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen(!moreOpen)}
                onBlur={() => setTimeout(() => setMoreOpen(false), 150)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSecondaryActive
                    ? "bg-electric/10 text-electric"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                More
                <ChevronDown size={13} className={`transition-transform ${moreOpen ? "rotate-180" : ""}`} />
              </button>

              {moreOpen && (
                <div className="absolute top-full mt-1 right-0 w-44 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                  {secondaryNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors mx-1 rounded-lg ${
                          isActive ? "bg-electric/10 text-electric" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={15} strokeWidth={1.8} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-800 leading-none">{userName}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {userZone}{userTier > 0 ? ` · Tier ${userTier}` : ""}
              </p>
            </div>

            <Link
              href="/profile"
              className={`hidden md:flex w-8 h-8 rounded-full items-center justify-center border transition-colors ${
                pathname === "/profile"
                  ? "bg-electric/10 border-electric/20 text-electric"
                  : "bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-700"
              }`}
              aria-label="Profile"
            >
              <User size={14} strokeWidth={1.8} />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            >
              <LogOut size={13} strokeWidth={1.8} />
              Logout
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 border border-gray-200"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={18} className="text-gray-700" /> : <Menu size={18} className="text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {[...PRIMARY_NAV, ...secondaryNav, { href: "/profile", label: "Profile", icon: User }].map((item) => {
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
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={17} strokeWidth={1.8} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full mt-1 border-t border-gray-100 pt-3"
              >
                <LogOut size={17} strokeWidth={1.8} />
                Log Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <Footer />

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/97 backdrop-blur-xl border-t border-gray-200">
        <div className="grid grid-cols-5 h-16">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors ${
                  isActive ? "text-electric" : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.5} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
