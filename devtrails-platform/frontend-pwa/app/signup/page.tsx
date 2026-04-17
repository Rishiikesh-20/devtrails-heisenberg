"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, CheckCircle } from "lucide-react";
import { useToast } from "../components/ui/ToastProvider";
import { apiPost, setSignupDraft, setUser } from "../lib/api";
import type { SignupDraft, SignupResponse } from "../lib/types";

const initialForm: SignupDraft = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
};

export default function SignupPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<SignupDraft>(initialForm);

  const onChange = (field: keyof SignupDraft, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.email.trim() ||
      !password.trim()
    ) {
      addToast("Please fill out all required fields.", "warning");
      return;
    }

    if (!acceptTerms) {
      addToast("Please accept the Terms of Service and Privacy Policy.", "warning");
      return;
    }

    if (password.length < 6) {
      addToast("Password must be at least 6 characters.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiPost<SignupResponse>("/api/v1/signup", {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password,
      });

      setUser(res.user);
      setSignupDraft(form);
      addToast(res.message || "Account created! Let's set up your protection.", "success");
      router.push("/onboarding");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Unable to continue signup right now. Please try again.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Decorative Panel ─────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden" style={{ background: "linear-gradient(145deg, #0B1F3A 0%, #0F2847 50%, #132F52 100%)" }}>
        {/* Geometric tile grid */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-5 gap-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="border border-white/5 relative overflow-hidden">
              {i % 3 !== 1 && (
                <div
                  className="absolute w-full h-full"
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
            Join 12,500+ delivery<br />partners already protected
          </h2>
          <div className="flex flex-col gap-2 mt-2">
            {["Instant UPI payouts", "No claim forms", "AI-verified protection"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-white/60">
                <CheckCircle size={14} className="text-teal-400" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Form ─────────────────────────────── */}
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-400 mb-8">
            Already have an account?{" "}
            <Link href="/login" className="text-electric font-medium hover:underline">
              Log in
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
            <div className="grid grid-cols-2 gap-3">
              <input
                id="signup-firstname"
                type="text"
                required
                placeholder="First name"
                value={form.first_name}
                onChange={(e) => onChange("first_name", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric transition-all"
              />
              <input
                id="signup-lastname"
                type="text"
                required
                placeholder="Last name"
                value={form.last_name}
                onChange={(e) => onChange("last_name", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric transition-all"
              />
            </div>

            <input
              id="signup-email"
              type="email"
              required
              placeholder="Email address"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric transition-all"
            />

            <input
              id="signup-phone"
              type="tel"
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric transition-all"
            />

            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                required
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

            {/* Terms */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                id="signup-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-electric focus:ring-electric/30 shrink-0"
              />
              <span className="text-xs text-gray-500 leading-snug">
                I agree to WageLock&apos;s{" "}
                <a href="#" className="text-electric hover:underline">Terms of Service</a>{" "}
                and{" "}
                <a href="#" className="text-electric hover:underline">Privacy Policy</a>
              </span>
            </label>

            <button
              type="submit"
              id="signup-submit"
              disabled={submitting}
              className="w-full bg-electric hover:bg-electric-600 text-white font-semibold text-sm py-3 rounded-xl transition-colors mt-1 disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
