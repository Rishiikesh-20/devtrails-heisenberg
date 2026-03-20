"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Shield,
  Clock,
  Database,
  CloudRain,
  ServerOff,
  Fuel,
  ShieldAlert,
  TrafficCone,
  MapPin,
  Zap,
  ArrowDown,
  Terminal,
  Radio,
  ChevronRight,
  User,
  AlertTriangle,
  PlayCircle
} from "lucide-react";

/* ─────────────── Intersection Observer Hook ─────────────── */
function useRevealOnScroll() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("animate-fade-in-up");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ─────────────── Data ─────────────── */
const PROBLEMS = [
  {
    icon: Clock,
    title: "The Income Gap",
    description:
      "Gig workers earn daily. Traditional insurance takes 21 days to pay.",
  },
  {
    icon: Database,
    title: "The Data Gap",
    description:
      "Current models require manual proof, photos, and assessors.",
  },
  {
    icon: Shield,
    title: "The Coverage Gap",
    description:
      "Health insurance doesn't pay you when a platform server crashes or a city floods.",
  },
];

const PERSONAS = [
  {
    name: "Raju",
    location: "South Delhi",
    tier: "Tier 3",
    tierLabel: "High Risk",
    scenario:
      "Encounters sudden monsoon flooding (Rain > 15mm/hr). Earnings stop.",
    payout: "₹360",
    trigger: "Weather API — OpenWeatherMap",
    triggerIcon: CloudRain,
  },
  {
    name: "Meena",
    location: "Bengaluru",
    tier: "Tier 2",
    tierLabel: "Elevated Risk",
    scenario:
      "Encounters sudden Section 144 Curfew. Earnings stop.",
    payout: "₹392",
    trigger: "NLP Oracle — News/Twitter",
    triggerIcon: ShieldAlert,
  },
  {
    name: "Arjun",
    location: "Hyderabad",
    tier: "Tier 1",
    tierLabel: "Standard Risk",
    scenario:
      "Encounters commercial LPG shortage shutting down cloud kitchens. Earnings stop.",
    payout: "₹208",
    trigger: "NLP Consensus — News Aggregation",
    triggerIcon: Fuel,
  },
];

const TRIGGERS = [
  {
    name: "Extreme Weather",
    source: "OpenWeatherMap API",
    condition: "> 15mm/hr rainfall",
    oracle: "Weather Oracle",
    icon: CloudRain,
  },
  {
    name: "Platform Outage",
    source: "Downdetector API",
    condition: "70% drop in active orders",
    oracle: "Uptime Oracle",
    icon: ServerOff,
  },
  {
    name: "LPG / Fuel Shortage",
    source: "NLP News Aggregation",
    condition: "3+ independent sources confirming closures",
    oracle: "Consensus Oracle",
    icon: Fuel,
  },
  {
    name: "Sudden Curfews",
    source: "X (Twitter) Police API & NewsAPI",
    condition: "Section 144 declared",
    oracle: "Social Oracle",
    icon: ShieldAlert,
  },
  {
    name: "Severe Traffic / Blockades",
    source: "TomTom Traffic API",
    condition: "< 5 km/h avg speed",
    oracle: "Mobility Oracle",
    icon: TrafficCone,
  },
];

/* ─────────────── Page ─────────────── */
export default function Home() {
  const problemRef = useRevealOnScroll();
  const personaRef = useRevealOnScroll();
  const triggerRef = useRevealOnScroll();

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section
        id="hero"
        className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center"
      >
        {/* Radial glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-white/[0.03] blur-[120px] animate-pulse-glow" />
        </div>

        {/* Top badge */}
        <div className="relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-500 text-xs font-medium tracking-wide mb-8 animate-fade-in-up">
          <Radio size={12} strokeWidth={1.5} />
          Parametric Income Protection Protocol
        </div>

        {/* Headline */}
        <h1 className="relative z-10 text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white leading-none animate-fade-in-up animation-delay-100">
          WageLock<span className="text-zinc-600">.</span>
        </h1>

        {/* Subheadline */}
        <p className="relative z-10 max-w-2xl mt-6 text-base sm:text-lg text-zinc-500 leading-relaxed font-light animate-fade-in-up animation-delay-200">
          Parametric Income Protection for the Gig Economy.
          <br className="hidden sm:block" />
          Automated payouts in under 10 minutes. Zero claims. Zero paperwork.
        </p>

        {/* CTAs */}
        <div className="relative z-10 mt-10 flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up animation-delay-300">
          <a
            href="#problem"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl border border-white/[0.12] bg-white text-black hover:bg-zinc-200 text-sm font-semibold transition-all duration-300 backdrop-blur-sm group min-w-[200px]"
          >
            <Zap size={16} strokeWidth={1.5} className="text-black group-hover:scale-110 transition-transform" />
            Learn More
            <ArrowDown size={14} strokeWidth={1.5} className="text-zinc-700 group-hover:translate-y-0.5 transition-transform" />
          </a>
          
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-sm font-semibold text-zinc-300 hover:text-white transition-all duration-300 backdrop-blur-sm group min-w-[200px]"
          >
            <PlayCircle size={16} strokeWidth={1.5} className="text-zinc-400 group-hover:text-white transition-colors group-hover:scale-110" />
            Interactive Mock Demo
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-700 animate-fade-in-up animation-delay-500">
          <span className="text-[10px] uppercase tracking-[0.25em] font-medium">
            Scroll
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-zinc-700 to-transparent" />
        </div>
      </section>

      {/* ═══════════════════ PROBLEM STATEMENT ═══════════════════ */}
      <section id="problem" className="px-6 py-24 lg:py-32">
        <div ref={problemRef} className="max-w-6xl mx-auto opacity-0">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-600 flex items-center justify-center gap-2 mb-4">
              <AlertTriangle size={12} strokeWidth={1.5} />
              The Problem
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Insurance was never built<br className="hidden sm:block" />
              <span className="text-zinc-600"> for gig workers.</span>
            </h2>
          </div>

          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PROBLEMS.map((problem, i) => {
              const Icon = problem.icon;
              return (
                <div
                  key={problem.title}
                  className={`glass-card rounded-2xl p-7 lg:p-8 flex flex-col gap-5 animation-delay-${(i + 1) * 100}`}
                >
                  <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center">
                    <Icon
                      size={20}
                      strokeWidth={1.5}
                      className="text-zinc-400"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white tracking-tight mb-2">
                      {problem.title}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {problem.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ PERSONAS ═══════════════════ */}
      <section id="personas" className="px-6 py-24 lg:py-32">
        <div ref={personaRef} className="max-w-6xl mx-auto opacity-0">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-600 flex items-center justify-center gap-2 mb-4">
              <User size={12} strokeWidth={1.5} />
              Who We Protect
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Real workers.<br className="hidden sm:block" />
              <span className="text-zinc-600"> Real scenarios.</span>
            </h2>
          </div>

          {/* Persona Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PERSONAS.map((persona) => {
              const TriggerIcon = persona.triggerIcon;
              return (
                <div
                  key={persona.name}
                  className="glass-card rounded-2xl overflow-hidden flex flex-col"
                >
                  {/* Header */}
                  <div className="p-6 pb-4 border-b border-white/[0.06]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          {persona.name}
                        </h3>
                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} strokeWidth={1.5} />
                          {persona.location}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-400">
                        {persona.tier}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                      {persona.tierLabel}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {persona.scenario}
                    </p>

                    <div className="space-y-3">
                      {/* Payout */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                          Instant Payout
                        </span>
                        <span className="text-xl font-bold text-white mono tracking-tight">
                          {persona.payout}
                        </span>
                      </div>

                      {/* Trigger Source */}
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <TriggerIcon
                          size={14}
                          strokeWidth={1.5}
                          className="text-zinc-500 shrink-0"
                        />
                        <span className="text-xs text-zinc-500 font-medium">
                          {persona.trigger}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ PARAMETRIC TRIGGERS ═══════════════════ */}
      <section id="triggers" className="px-6 py-24 lg:py-32">
        <div ref={triggerRef} className="max-w-6xl mx-auto opacity-0">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-600 flex items-center justify-center gap-2 mb-4">
              <Terminal size={12} strokeWidth={1.5} />
              Data Oracles
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
              Parametric triggers.<br className="hidden sm:block" />
              <span className="text-zinc-600"> Not paperwork.</span>
            </h2>
            <p className="max-w-xl mx-auto mt-4 text-sm text-zinc-600 leading-relaxed">
              Five data-driven oracles continuously monitor real-world conditions. When a threshold is breached, payouts execute automatically.
            </p>
          </div>

          {/* Terminal-style data table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Trigger</div>
              <div className="col-span-3">Data Source</div>
              <div className="col-span-3">Threshold</div>
              <div className="col-span-2">Oracle Type</div>
            </div>

            {/* Table Rows */}
            {TRIGGERS.map((trigger, i) => {
              const Icon = trigger.icon;
              return (
                <div
                  key={trigger.name}
                  className="terminal-row grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-5 md:py-4 border-b border-white/[0.04] last:border-b-0 items-center"
                >
                  {/* Index */}
                  <div className="col-span-1 hidden md:block">
                    <span className="mono text-xs text-zinc-700">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Trigger Name */}
                  <div className="md:col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                      <Icon
                        size={14}
                        strokeWidth={1.5}
                        className="text-zinc-500"
                      />
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {trigger.name}
                    </span>
                  </div>

                  {/* Data Source */}
                  <div className="md:col-span-3">
                    <span className="md:hidden text-[10px] font-bold uppercase tracking-wider text-zinc-700 mr-2">
                      Source:
                    </span>
                    <span className="mono text-xs text-zinc-400">
                      {trigger.source}
                    </span>
                  </div>

                  {/* Threshold */}
                  <div className="md:col-span-3">
                    <span className="md:hidden text-[10px] font-bold uppercase tracking-wider text-zinc-700 mr-2">
                      Threshold:
                    </span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                      <ChevronRight size={10} strokeWidth={1.5} className="text-zinc-700" />
                      {trigger.condition}
                    </span>
                  </div>

                  {/* Oracle Type */}
                  <div className="md:col-span-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/[0.06] bg-white/[0.03] text-zinc-500">
                      <Radio size={8} strokeWidth={1.5} />
                      {trigger.oracle}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer status bar */}
          <div className="mt-4 flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-[10px] text-zinc-700 mono">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-pulse" />
              5 oracles active
            </div>
            <span className="text-[10px] text-zinc-700 mono">
              WageLock Protocol v1.0
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-white/[0.06] px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center">
              <Zap size={12} strokeWidth={1.5} className="text-zinc-500" />
            </div>
            <span className="text-sm font-bold tracking-tight text-zinc-400">
              WageLock
            </span>
          </div>
          <p className="text-[11px] text-zinc-700 tracking-wide">
            Parametric Income Protection — Hackathon Demo
          </p>
        </div>
      </footer>
    </main>
  );
}
