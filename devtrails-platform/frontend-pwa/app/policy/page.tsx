import { ShieldCheck, CloudRain, ServerOff, ShieldAlert, TrafficCone, Fuel, Calculator, RotateCcw } from "lucide-react";
import { PageShell } from "../components/ui/PageShell";
import { mockWorkerPolicy } from "../components/policy/mockPolicyData";
import { PolicyStatusCard } from "../components/policy/PolicyStatusCard";
import { WeeklyCycleTimeline } from "../components/policy/WeeklyCycleTimeline";
import { WaitingPeriodBanner } from "../components/policy/WaitingPeriodBanner";
import { CoverageCapsCard } from "../components/policy/CoverageCapsCard";
import { RenewalActionsPanel } from "../components/policy/RenewalActionsPanel";
import { formatInr, formatLongDate } from "../components/policy/policyFormatters";

const COVERED_TRIGGERS = [
  {
    label: "Heavy Rain / Extreme Weather",
    icon: CloudRain,
    color: "#2563EB",
    bg: "bg-blue-50",
    border: "border-blue-100",
    severity: "1.0×",
    description: "Precipitation above 15mm/hr in your zone",
  },
  {
    label: "Platform Outage",
    icon: ServerOff,
    color: "#8B5CF6",
    bg: "bg-violet-50",
    border: "border-violet-100",
    severity: "1.0×",
    description: "Delivery app downtime lasting ≥30 minutes",
  },
  {
    label: "Curfew / Section 144",
    icon: ShieldAlert,
    color: "#EF4444",
    bg: "bg-red-50",
    border: "border-red-100",
    severity: "1.2×",
    description: "Government-mandated movement restrictions",
  },
  {
    label: "Festival / Heavy Traffic",
    icon: TrafficCone,
    color: "#F59E0B",
    bg: "bg-amber-50",
    border: "border-amber-100",
    severity: "0.5×",
    description: "Congestion ratio ≥1.6× normal on primary routes",
  },
  {
    label: "Fuel / LPG Shortage",
    icon: Fuel,
    color: "#14B8A6",
    bg: "bg-teal-50",
    border: "border-teal-100",
    severity: "0.65×",
    description: "Verified supply disruption affecting vehicle operation",
  },
];

export default function PolicyPage() {
  const policy = mockWorkerPolicy;

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-8">
        <header className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric">
            Worker Insurance
          </p>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Policy Center</h1>
              <p className="text-sm text-gray-600 mt-1">
                Weekly premium model with transparent coverage cycle and renewal controls.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <ShieldCheck size={14} className="text-teal-500" />
              {policy.policyNumber}
            </div>
          </div>
        </header>

        {/* Quick stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article className="premium-card p-5">
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Status</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <p className="text-sm font-semibold text-teal-600 capitalize">{policy.status}</p>
            </div>
          </article>

          <article className="premium-card p-5">
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Next Renewal</p>
            <p className="text-xs text-gray-600 mt-2">Auto-renews {new Date(policy.nextRenewalDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</p>
          </article>

          <article className="premium-card p-5">
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Coverage Remaining</p>
            <p className="text-sm font-bold text-teal-600">{formatInr(policy.caps.remainingCoverage)}</p>
          </article>
        </section>

        <WaitingPeriodBanner
          applies={policy.waitingPeriod.applies}
          reason={policy.waitingPeriod.reason}
          endsAt={policy.waitingPeriod.endsAt}
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <PolicyStatusCard
              planName={policy.planName}
              policyNumber={policy.policyNumber}
              zoneLabel={policy.zoneLabel}
              status={policy.status}
              weeklyPremium={policy.weeklyPremium}
              nextRenewalDate={policy.nextRenewalDate}
            />

            <WeeklyCycleTimeline
              cycleStart={policy.cycleStart}
              status={policy.status}
              waitingPeriodEndsAt={policy.waitingPeriod.endsAt}
            />

            {/* Payout Formula Explainer */}
            <div className="premium-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-electric/8 flex items-center justify-center">
                  <Calculator size={16} className="text-electric" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-electric">Payout Formula</p>
                  <h3 className="text-sm font-bold text-gray-700">How your compensation is calculated</h3>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-sm font-mono text-gray-700 leading-loose">
                  Final Payout = min(
                  <br />
                  &nbsp;&nbsp;Lost Hours × Hourly Income × <span className="text-electric font-bold">Severity Factor</span>,
                  <br />
                  &nbsp;&nbsp;Daily Cap,
                  <br />
                  &nbsp;&nbsp;Weekly Cap
                  <br />
                  )
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                {[
                  { label: "Co-Pay", value: "20%", desc: "You bear 20% to retain work-around incentive", color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Waiting Period", value: "48 hrs", desc: "New policies have a 48-hour activation delay", color: "text-violet-600", bg: "bg-violet-50" },
                  { label: "Max Cycle Cap", value: "Weekly", desc: "Payouts are capped per weekly policy cycle", color: "text-teal-600", bg: "bg-teal-50" },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl ${item.bg} p-3`}>
                    <p className={`text-lg font-extrabold ${item.color}`}>{item.value}</p>
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mt-0.5">{item.label}</p>
                    <p className="text-[10px] text-gray-700 mt-1 leading-snug">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <CoverageCapsCard
              maxPayout={policy.caps.maxPayout}
              remainingCoverage={policy.caps.remainingCoverage}
              claimsPaidThisCycle={policy.caps.claimsPaidThisCycle}
            />

            <RenewalActionsPanel
              nextRenewalDate={policy.nextRenewalDate}
              autoRenewEnabled={policy.autoRenewEnabled}
            />

            {/* Covered Triggers with Severity Factors */}
            <div className="premium-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <RotateCcw size={14} className="text-gray-500" />
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Covered Triggers & Severity
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {COVERED_TRIGGERS.map((trigger) => {
                  const Icon = trigger.icon;
                  return (
                    <div key={trigger.label} className="px-5 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                      <div className={`w-8 h-8 rounded-lg ${trigger.bg} border ${trigger.border} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon size={14} style={{ color: trigger.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-gray-800">{trigger.label}</p>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: `${trigger.color}12`, color: trigger.color }}
                          >
                            {trigger.severity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 leading-snug">{trigger.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
