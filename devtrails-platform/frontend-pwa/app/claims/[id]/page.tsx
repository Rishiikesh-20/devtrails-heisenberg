"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { CalendarClock, FileBadge2, ShieldCheck } from "lucide-react";
import { PageShell } from "../../components/ui/PageShell";
import { getMockClaimById } from "../../components/claims/mockClaimData";
import { ClaimLifecycleStepper } from "../../components/claims/ClaimLifecycleStepper";
import { DecisionReasonPanel } from "../../components/claims/DecisionReasonPanel";
import { BasicFraudResult } from "../../components/claims/BasicFraudResult";
import { ConfidenceScore, EvidencePanel, FraudGateBreakdown } from "../../components/claims/ExplainabilityComponents";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatInr(value: number): string {
  return `₹${Math.max(0, value).toLocaleString("en-IN")}`;
}

function normalizeRouteParam(idParam: string | string[] | undefined): string {
  if (Array.isArray(idParam)) {
    return idParam[0] ?? "CLM-2026-00127";
  }
  return idParam || "CLM-2026-00127";
}

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const claimID = normalizeRouteParam(params?.id);

  const claim = useMemo(() => getMockClaimById(claimID), [claimID]);

  const statusClass =
    claim.decision === "approved"
      ? "bg-teal-500/12 border border-teal-400/30 text-teal-200"
      : "bg-red-500/12 border border-red-400/35 text-red-200";

  const decisionAt = claim.timeline.paidAt || claim.timeline.approvedAt || claim.timeline.verifiedAt;

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-6">
        <header className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric">Parametric Claim Detail</p>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Claim {claim.id}</h1>
              <p className="text-sm text-white/45 mt-1">
                Transparent lifecycle, automated verification, and trust-focused decision evidence.
              </p>
            </div>

            <span className={`text-[11px] uppercase tracking-wider font-semibold rounded-full px-3 py-1 ${statusClass}`}>
              {claim.decision}
            </span>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <article className="rounded-xl border border-white/10 bg-white/4 p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/45">Claim Amount</p>
            <p className="text-lg font-semibold mt-1">{formatInr(claim.claimAmount)}</p>
            <p className="text-[11px] text-white/45 mt-1">Event: {claim.eventType}</p>
          </article>

          <article className="rounded-xl border border-white/10 bg-white/4 p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/45">Payout</p>
            <p className="text-lg font-semibold mt-1 text-teal-200">{formatInr(claim.payoutAmount)}</p>
            <p className="text-[11px] text-white/45 mt-1">Policy: {claim.policyId}</p>
          </article>

          <article className="rounded-xl border border-white/10 bg-white/4 p-4">
            <p className="text-[10px] uppercase tracking-wider text-white/45">Submitted At</p>
            <p className="text-sm font-semibold mt-1">{formatDateTime(claim.timeline.submittedAt)}</p>
            <p className="text-[11px] text-white/45 mt-1">Zone: {claim.zone}</p>
          </article>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <ClaimLifecycleStepper
              status={claim.status}
              decision={claim.decision}
              timeline={claim.timeline}
            />

            <DecisionReasonPanel
              decision={claim.decision}
              summary={claim.decisionSummary}
              reasons={claim.decisionReasons}
              claimAmount={claim.claimAmount}
              payoutAmount={claim.payoutAmount}
              decidedAt={decisionAt}
            />

            <FraudGateBreakdown />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <ConfidenceScore />
            <BasicFraudResult fraud={claim.fraud} />
            <EvidencePanel />

            <section className="glass-card rounded-2xl p-6 space-y-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold">Claim Integrity</p>
              <div className="rounded-xl border border-white/10 bg-white/4 p-4 space-y-2">
                <p className="text-sm font-semibold inline-flex items-center gap-2">
                  <ShieldCheck size={15} className="text-teal-300" /> Decision trail preserved
                </p>
                <p className="text-sm font-semibold inline-flex items-center gap-2">
                  <FileBadge2 size={15} className="text-electric" /> Parametric checks logged
                </p>
                <p className="text-sm font-semibold inline-flex items-center gap-2">
                  <CalendarClock size={15} className="text-amber-300" /> Last update: {formatDateTime(decisionAt || claim.timeline.submittedAt)}
                </p>
              </div>
              <p className="text-[11px] text-white/45">
                This page is using mock data to demonstrate the claim timeline and trust indicators.
              </p>
            </section>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
