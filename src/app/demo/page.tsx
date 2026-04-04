"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  Fuel,
  ShieldAlert,
  CloudLightning,
  CarFront,
  ServerOff,
  CheckCircle2,
  Wallet,
  MapPin,
  User,
  Activity,
  Zap,
  AlertCircle,
} from "lucide-react";

import PredictiveAlertBanner from "@/components/PredictiveAlertBanner";
import AuditTrail from "@/components/AuditTrail";
import {
  ApiError,
  apiGet,
  apiPost,
  ensureDemoUser,
  type ClaimListItem,
  type ClaimListResponse,
  type DemoBootstrapConfig,
  type PayoutListItem,
  type PayoutListResponse,
  type RiskQuoteResponse,
  type SessionUser,
  type WalletResponse,
  type WeatherListResponse,
  type WeatherSignal,
} from "@/lib/devtrailsApi";

const ThreeBackground = dynamic(() => import("@/components/ThreeBackground"), {
  ssr: false,
});

type CoverageScenario = {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  eventType: string;
  severityFactor: number;
};

type DashboardSnapshot = {
  wallet: WalletResponse;
  payouts: PayoutListItem[];
  claims: ClaimListItem[];
  latestSignal: WeatherSignal | null;
};

const COVERAGE_SCENARIOS: CoverageScenario[] = [
  {
    id: "fuel",
    title: "Fuel shortage (LPG / Petrol)",
    icon: Fuel,
    eventType: "fuel_shortage",
    severityFactor: 0.65,
  },
  {
    id: "curfew",
    title: "Curfew or law enforcement",
    icon: ShieldAlert,
    eventType: "curfew",
    severityFactor: 1.2,
  },
  {
    id: "weather",
    title: "Extreme weather events",
    icon: CloudLightning,
    eventType: "heavy_rain",
    severityFactor: 1.0,
  },
  {
    id: "traffic",
    title: "Festival traffic congestion",
    icon: CarFront,
    eventType: "traffic_disruption",
    severityFactor: 0.5,
  },
  {
    id: "outage",
    title: "Food delivery platform outage",
    icon: ServerOff,
    eventType: "platform_outage",
    severityFactor: 1.0,
  },
];

const ZONE_LABELS: Record<string, string> = {
  south_delhi: "South Delhi",
  north_delhi: "North Delhi",
  east_delhi: "East Delhi",
  west_delhi: "West Delhi",
  koramangala_blr: "Koramangala, Bengaluru",
  hsr_layout_blr: "HSR Layout, Bengaluru",
  indiranagar_blr: "Indiranagar, Bengaluru",
  andheri_mum: "Andheri, Mumbai",
  bandra_mum: "Bandra, Mumbai",
  powai_mum: "Powai, Mumbai",
  hitech_city_hyd: "HITEC City, Hyderabad",
  t_nagar_che: "T Nagar, Chennai",
};

function formatZone(zone: string): string {
  const normalized = zone.trim().toLowerCase();
  if (ZONE_LABELS[normalized]) {
    return ZONE_LABELS[normalized];
  }

  return zone
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.details ? `${err.message}: ${err.details}` : err.message;
  }

  if (err instanceof Error && err.message.trim() !== "") {
    return err.message;
  }

  return fallback;
}

export default function Home() {
  const searchParams = useSearchParams();

  const [user, setUser] = useState<SessionUser | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCurrency, setWalletCurrency] = useState("INR");
  const [payouts, setPayouts] = useState<PayoutListItem[]>([]);
  const [claims, setClaims] = useState<ClaimListItem[]>([]);
  const [latestSignal, setLatestSignal] = useState<WeatherSignal | null>(null);

  const [premiumAmount, setPremiumAmount] = useState<number | null>(null);
  const [tier, setTier] = useState<number | null>(null);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAssessing, setIsAssessing] = useState(false);
  const [isTriggering, setIsTriggering] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: "red" | "green";
  } | null>(null);

  const searchKey = searchParams.toString();
  const demoConfig = useMemo<DemoBootstrapConfig>(() => {
    const params = new URLSearchParams(searchKey);

    return {
      email:
        params.get("email") ??
        process.env.NEXT_PUBLIC_DEMO_EMAIL ??
        "rahul.demo@wagelock.local",
      fullName:
        params.get("name") ??
        process.env.NEXT_PUBLIC_DEMO_NAME ??
        "Rahul Delivery Partner",
      zone:
        params.get("zone") ??
        process.env.NEXT_PUBLIC_DEMO_ZONE ??
        "andheri_mum",
      shiftStart:
        params.get("shift_start") ??
        process.env.NEXT_PUBLIC_DEMO_SHIFT_START ??
        "09:00",
      shiftEnd:
        params.get("shift_end") ??
        process.env.NEXT_PUBLIC_DEMO_SHIFT_END ??
        "17:00",
      password:
        process.env.NEXT_PUBLIC_DEMO_PASSWORD ??
        "demo-password-not-used",
    };
  }, [searchKey]);

  const loadLiveData = useCallback(
    async (currentUser: SessionUser, signal?: AbortSignal): Promise<DashboardSnapshot> => {
      const encodedUserID = encodeURIComponent(currentUser.id);
      const encodedZone = encodeURIComponent(currentUser.zone);

      const [walletRes, payoutsRes, claimsRes, weatherRes] = await Promise.all([
        apiGet<WalletResponse>(`/wallet?user_id=${encodedUserID}`, signal),
        apiGet<PayoutListResponse>(`/payouts?user_id=${encodedUserID}&limit=8`, signal),
        apiGet<ClaimListResponse>(`/claims?user_id=${encodedUserID}&limit=8`, signal),
        apiGet<WeatherListResponse>(`/api/v1/weather?zone=${encodedZone}&limit=1`, signal),
      ]);

      const snapshot: DashboardSnapshot = {
        wallet: walletRes,
        payouts: payoutsRes.items ?? [],
        claims: claimsRes.items ?? [],
        latestSignal: weatherRes.data?.[0] ?? null,
      };

      setWalletBalance(snapshot.wallet.balance ?? 0);
      setWalletCurrency((snapshot.wallet.currency || "INR").toUpperCase());
      setPayouts(snapshot.payouts);
      setClaims(snapshot.claims);
      setLatestSignal(snapshot.latestSignal);

      return snapshot;
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;

    const bootstrap = async () => {
      setIsBootstrapping(true);
      setLoadError(null);

      try {
        const bootstrappedUser = await ensureDemoUser(demoConfig, controller.signal);
        if (disposed) return;

        setUser(bootstrappedUser);
        setPremiumAmount(bootstrappedUser.weekly_premium);
        setTier(bootstrappedUser.tier);

        await loadLiveData(bootstrappedUser, controller.signal);
      } catch (err) {
        if (controller.signal.aborted || disposed) return;
        setLoadError(readErrorMessage(err, "Failed to bootstrap demo user"));
      } finally {
        if (!disposed) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      disposed = true;
      controller.abort();
    };
  }, [demoConfig, loadLiveData]);

  useEffect(() => {
    if (!user) return;

    const intervalID = window.setInterval(() => {
      void loadLiveData(user).catch(() => {
        // Keep the dashboard responsive even when one poll fails.
      });
    }, 15000);

    return () => window.clearInterval(intervalID);
  }, [loadLiveData, user]);

  const handleAiAssessment = async () => {
    if (!user || isAssessing) return;

    setIsAssessing(true);
    setActiveToast({
      type: "red",
      message: "Refreshing AI risk quote from backend...",
    });

    try {
      const quote = await apiPost<RiskQuoteResponse>("/api/v1/risk/quote", {
        zone: user.zone,
        shift_start: user.shift_start,
        shift_end: user.shift_end,
      });

      setPremiumAmount(quote.weekly_premium);
      setTier(quote.tier);
      setUser((prev: SessionUser | null) =>
        prev
          ? {
              ...prev,
              tier: quote.tier,
              weekly_premium: quote.weekly_premium,
              pricing_breakdown: quote.pricing_breakdown,
            }
          : prev,
      );

      setActiveToast({
        type: "green",
        message: `AI quote updated: Tier ${quote.tier}, weekly premium Rs ${quote.weekly_premium.toFixed(2)}.`,
      });
    } catch (err) {
      setActiveToast({
        type: "red",
        message: readErrorMessage(err, "Failed to refresh AI risk quote"),
      });
    } finally {
      setIsAssessing(false);
      window.setTimeout(() => setActiveToast(null), 3500);
    }
  };

  const triggerSimulation = async (scenario: CoverageScenario) => {
    if (!user || isTriggering) return;

    setIsTriggering(scenario.id);
    setActiveToast({
      type: "red",
      message: `Triggering ${scenario.title} for ${formatZone(user.zone)}...`,
    });

    try {
      await apiPost<{
        message: string;
        event_id: string;
      }>("/api/v1/simulate-event", {
        event_type: scenario.eventType,
        zone_id: user.zone,
        severity_factor: scenario.severityFactor,
      });

      const snapshot = await loadLiveData(user);
      const newestClaim = snapshot.claims[0];

      if (newestClaim) {
        setActiveToast({
          type: "green",
          message: `Event processed. Latest decision: ${newestClaim.decision}, FRS ${newestClaim.frs_score}.`,
        });
      } else {
        setActiveToast({
          type: "green",
          message: "Event processed. No claim records returned for this run yet.",
        });
      }
    } catch (err) {
      setActiveToast({
        type: "red",
        message: readErrorMessage(err, "Failed to trigger disruption simulation"),
      });
    } finally {
      setIsTriggering(null);
      window.setTimeout(() => setActiveToast(null), 4000);
    }
  };

  const riderName = user?.full_name ?? "Bootstrapping demo user";
  const activeZone = user ? formatZone(user.zone) : "Resolving zone";
  const currentPremium = premiumAmount ?? user?.weekly_premium ?? 0;
  const currentTier = tier ?? user?.tier ?? 0;
  const approvedClaims = claims.filter(
    (claim: ClaimListItem) => claim.status === "approved",
  ).length;

  return (
    <>
      <ThreeBackground />

      <main className="relative z-10 min-h-screen pb-36">
        <header className="sticky top-0 z-30 glass-panel px-6 py-4 lg:px-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
                <Zap size={18} className="text-black" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white hidden sm:inline">
                WageLock
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white leading-tight">{riderName}</p>
                <p className="text-xs text-zinc-500 flex items-center justify-end gap-1 mt-0.5">
                  <MapPin size={10} />
                  {activeZone}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                <User size={18} className="text-zinc-400" />
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-6 lg:py-10 space-y-6">
          <PredictiveAlertBanner
            latestClaim={claims[0] ?? null}
            latestSignal={latestSignal}
            loading={isBootstrapping}
            error={loadError}
          />

          {loadError && (
            <div className="glass-card rounded-xl p-4 border border-white/20 text-sm text-zinc-400 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{loadError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <div className="glass-card rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/6">
                    <Wallet size={20} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                      Wallet Balance
                    </p>
                    {isBootstrapping ? (
                      <div className="h-8 w-36 rounded bg-white/6 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold tracking-tight text-white transition-all duration-500 mono">
                        Rs {walletBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                      </p>
                    )}
                    <p className="text-[10px] text-zinc-600 mt-1">Currency: {walletCurrency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-white/6 text-zinc-400 px-3 py-1.5 rounded-full text-xs font-medium border border-white/6">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Live
                </div>
              </div>

              <div className="glass-card rounded-2xl relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/3 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 p-6 lg:p-8">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                    <Activity size={14} />
                    Dynamic Weekly Premium
                  </h2>

                  <div className="mb-8">
                    {isBootstrapping ? (
                      <div className="animate-pulse flex items-baseline gap-3">
                        <div className="h-14 w-28 bg-zinc-800 rounded-lg" />
                        <div className="h-6 w-16 bg-zinc-800/50 rounded" />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-6xl font-extrabold tracking-tighter text-white mono">
                            Rs {currentPremium.toFixed(2)}
                          </span>
                          <span className="text-zinc-600 font-medium text-lg">/ week</span>
                        </div>
                        <p className="text-xs text-zinc-500">Tier {currentTier}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAiAssessment}
                    disabled={isAssessing || isBootstrapping || !user}
                    className={`w-full py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 text-sm ${
                      isAssessing || isBootstrapping || !user
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                        : "bg-white hover:bg-zinc-200 text-black shadow-[0_0_30px_rgba(255,255,255,0.08)] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-[0.98]"
                    }`}
                  >
                    {isAssessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                        <span>Fetching AI quote...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} className="fill-black" />
                        <span>Run AI Risk Assessment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/6">
                  <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
                    Covered Disruptions
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1">
                    Trigger live backend events to test end-to-end processing.
                  </p>
                </div>

                <div className="divide-y divide-white/4">
                  {COVERAGE_SCENARIOS.map((scenario) => {
                    const Icon = scenario.icon;
                    const isActive = isTriggering === scenario.id;

                    return (
                      <button
                        key={scenario.id}
                        type="button"
                        onClick={() => {
                          void triggerSimulation(scenario);
                        }}
                        disabled={Boolean(isTriggering) || isBootstrapping || !user}
                        className="w-full px-5 py-3.5 flex items-center gap-3.5 hover:bg-white/2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-left"
                      >
                        <div className="p-2.5 rounded-xl bg-white/5 text-zinc-400">
                          <Icon size={18} strokeWidth={1.5} />
                        </div>
                        <span className="flex-1 text-sm text-zinc-300 font-medium">{scenario.title}</span>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 bg-white/5 px-2 py-1 rounded-full border border-white/6">
                          {isActive ? "Running" : "Trigger"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2">
                  Claim Snapshot
                </p>
                <div className="space-y-1 text-sm">
                  <p className="text-zinc-300">Total claims: {claims.length}</p>
                  <p className="text-zinc-300">Approved claims: {approvedClaims}</p>
                  {claims[0] ? (
                    <p className="text-zinc-400">
                      Latest: {claims[0].decision} (FRS {claims[0].frs_score})
                    </p>
                  ) : (
                    <p className="text-zinc-500">No claim decisions recorded yet.</p>
                  )}
                </div>
              </div>

              <AuditTrail payouts={payouts} loading={isBootstrapping} />
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 glass-panel px-5 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live backend mode
            </span>

            <div className="text-xs text-zinc-500 flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              Auto refresh every 15s
            </div>
          </div>
        </div>
      </main>

      {activeToast && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className={`w-full max-w-md mt-20 p-6 rounded-2xl shadow-2xl border flex items-start gap-4 transition-all ${
              activeToast.type === "red"
                ? "bg-zinc-950 border-white/10"
                : "bg-zinc-950 border-white/20"
            }`}
          >
            <div
              className={`mt-0.5 p-2.5 rounded-xl ${
                activeToast.type === "red"
                  ? "bg-white/6 text-zinc-400"
                  : "bg-white/10 text-white"
              }`}
            >
              {activeToast.type === "red" ? (
                <ShieldAlert size={24} />
              ) : (
                <CheckCircle2 size={24} />
              )}
            </div>
            <div className="flex-1">
              <h3
                className={`font-bold text-sm mb-1 ${
                  activeToast.type === "red" ? "text-zinc-300" : "text-white"
                }`}
              >
                {activeToast.type === "red" ? "Action status" : "Update"}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{activeToast.message}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
