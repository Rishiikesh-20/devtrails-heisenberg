import { ShieldCheck } from "lucide-react";
import { PageShell } from "../components/ui/PageShell";
import { mockWorkerPolicy } from "../components/policy/mockPolicyData";
import { PolicyStatusCard } from "../components/policy/PolicyStatusCard";
import { WeeklyCycleTimeline } from "../components/policy/WeeklyCycleTimeline";
import { WaitingPeriodBanner } from "../components/policy/WaitingPeriodBanner";
import { CoverageCapsCard } from "../components/policy/CoverageCapsCard";
import { RenewalActionsPanel } from "../components/policy/RenewalActionsPanel";
import { formatInr, formatLongDate } from "../components/policy/policyFormatters";

export default function PolicyPage() {
  const policy = mockWorkerPolicy;

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-6">
        <header className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric">
            Worker Insurance
          </p>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Policy Center</h1>
              <p className="text-sm text-white/45 mt-1">
                Weekly premium model with transparent coverage cycle and renewal controls.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/70">
              <ShieldCheck size={14} className="text-teal-300" />
              {policy.policyNumber}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <article className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/45">Status</p>
            <p className="text-sm font-semibold mt-1 capitalize">{policy.status}</p>
          </article>

          <article className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/45">Next Renewal</p>
            <p className="text-sm font-semibold mt-1">{formatLongDate(policy.nextRenewalDate)}</p>
          </article>

          <article className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/45">Coverage Remaining</p>
            <p className="text-sm font-semibold mt-1 text-teal-200">{formatInr(policy.caps.remainingCoverage)}</p>
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
          </div>
        </div>
      </div>
    </PageShell>
  );
}
