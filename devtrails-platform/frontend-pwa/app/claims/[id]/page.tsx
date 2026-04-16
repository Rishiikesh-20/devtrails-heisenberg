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
  if (Array.isArray(idParam)) return idParam[0] ?? "CLM-2026-00127";
  return idParam || "CLM-2026-00127";
}

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const claimID = normalizeRouteParam(params?.id);

  const claim = useMemo(() => getMockClaimById(claimID), [claimID]);

  const isApproved = claim.decision === "approved";
  const decisionAt = claim.timeline.paidAt || claim.timeline.approvedAt || claim.timeline.verifiedAt;

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-6">
        <header className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric">
            Parametric Claim Detail
          </p>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Claim {claim.id}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Transparent lifecycle, automated verification, and trust-focused decision evidence.
              </p>
            </div>

            <span
              className={`text-[11px] uppercase tracking-wider font-semibold rounded-full px-3 py-1.5 border ${
                isApproved
                  ? "bg-teal-50 border-teal-200 text-teal-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {claim.decision}
            </span>
          </div>
        </header>

        {/* Summary cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article className="premium-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Claim Amount</p>
            <p className="text-xl font-bold mt-1 text-gray-900">{formatInr(claim.claimAmount)}</p>
            <p className="text-xs text-gray-600 mt-1 capitalize">Event: {claim.eventType}</p>
          </article>

          <article className="premium-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payout</p>
            <p className="text-xl font-bold mt-1 text-teal-600">{formatInr(claim.payoutAmount)}</p>
            <p className="text-xs text-gray-600 mt-1">Policy: {claim.policyId}</p>
          </article>

          <article className="premium-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Submitted At</p>
            <p className="text-sm font-bold mt-1 text-gray-900">{formatDateTime(claim.timeline.submittedAt)}</p>
            <p className="text-xs text-gray-600 mt-1 capitalize">Zone: {claim.zone}</p>
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

            <section className="premium-card p-6 space-y-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold">
                Claim Integrity
              </p>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-800 inline-flex items-center gap-2">
                  <ShieldCheck size={15} className="text-teal-500" /> Decision trail preserved
                </p>
                <p className="text-sm font-medium text-gray-800 inline-flex items-center gap-2">
                  <FileBadge2 size={15} className="text-electric" /> Parametric checks logged
                </p>
                <p className="text-sm font-medium text-gray-800 inline-flex items-center gap-2">
                  <CalendarClock size={15} className="text-amber-500" />
                  Last update: {formatDateTime(decisionAt || claim.timeline.submittedAt)}
                </p>
              </div>
              <p className="text-[11px] text-gray-400">
                This page uses mock data to demonstrate the claim timeline and trust indicators.
              </p>
            </section>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
