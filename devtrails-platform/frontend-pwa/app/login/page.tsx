"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useToast } from "../components/ui/ToastProvider";
import { apiPost, setUser, setOnboarding, getUser, getSignupDraft } from "../lib/api";
import type { RegisterResponse, OnboardingPayload } from "../lib/types";

type LoginResponse = RegisterResponse & {
  full_name?: string;
  shift_start?: string;
  shift_end?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      addToast("Please enter both email and password.", "warning");
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await apiPost<LoginResponse>("/api/v1/login", {
        email: normalizedEmail,
        password,
      });

      setUser(res);

      if (res.full_name && res.zone && res.shift_start && res.shift_end) {
        const onboardingPayload: OnboardingPayload = {
          email: res.email,
          full_name: res.full_name,
          zone: res.zone,
          shift_start: res.shift_start,
          shift_end: res.shift_end,
        };
        setOnboarding(onboardingPayload);
      }

      if (remember) {
        localStorage.setItem("wagelock.last-email", normalizedEmail);
      }

      addToast(`Welcome back, ${res.full_name ?? "Partner"}! 👋`, "success");
      router.push("/dashboard");
    } catch (err) {
      // Local-session fallback
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = getUser();
      if (existingUser?.email?.trim().toLowerCase() === normalizedEmail) {
        addToast("Welcome back!", "success");
        router.push("/dashboard");
        return;
      }

      const signupDraft = getSignupDraft();
      if (signupDraft?.email?.trim().toLowerCase() === normalizedEmail) {
        addToast("Let's finish setting up your profile.", "info");
        router.push("/onboarding");
        return;
      }

      addToast(
        err instanceof Error ? err.message : "Sign in failed. Please check your details.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Form ─────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-10 w-fit">
            <div className="w-9 h-9 rounded-xl bg-electric flex items-center justify-center">
              <Shield size={18} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base">WageLock</span>
          </Link>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back!</h1>
          <p className="text-sm text-gray-400 mb-8">
            Don&apos;t have an account yet?{" "}
            <Link href="/signup" className="text-electric font-medium hover:underline">
              Sign up now
            </Link>
          </p>

          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <input
                id="login-email"
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric transition-all"
              />
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric transition-all pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-electric focus:ring-electric/30"
                />
                <span className="text-sm text-gray-500">Remember me</span>
              </label>
              <a href="#" className="text-sm text-electric hover:underline font-medium">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="w-full bg-electric hover:bg-electric-600 text-white font-semibold text-sm py-3 rounded-xl transition-colors mt-2 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Log in"}
            </button>

            <p className="text-xs text-gray-400 leading-relaxed">
              This prototype uses onboarding-based account setup. If you have not
              completed onboarding yet, we&apos;ll guide you there.
            </p>
          </form>
        </div>
      </div>

      {/* ── Right: Decorative Panel ─────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: "linear-gradient(145deg, #0B1F3A 0%, #0F2847 50%, #132F52 100%)" }}>
        {/* Geometric tile grid */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-5 gap-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="border border-white/5 relative overflow-hidden">
              {i % 3 !== 1 && (
                <div
                  className="absolute w-full h-full rounded-tl-full"
                  style={{
                    background: i % 5 === 0
                      ? "rgba(37,99,235,0.35)"
                      : i % 4 === 0
                        ? "rgba(37,99,235,0.18)"
                        : "rgba(37,99,235,0.08)",
                    bottom: 0,
                    right: 0,
                    borderRadius: i % 2 === 0 ? "100% 0 0 0" : "0 0 0 100%",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Centered brand text */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-2">
            <Shield size={24} strokeWidth={2} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white leading-snug">
            Income protection<br />for every shift
          </h2>
          <p className="text-white/40 text-sm max-w-xs leading-relaxed">
            Automatic payouts when disruptions hit. No paperwork. No delays.
          </p>
        </div>
      </div>
    </div>
  );
}
