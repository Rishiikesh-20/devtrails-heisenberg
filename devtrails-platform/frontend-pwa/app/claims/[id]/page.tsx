"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarClock, FileBadge2, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";
import { PageShell } from "../../components/ui/PageShell";
import { ClaimLifecycleStepper } from "../../components/claims/ClaimLifecycleStepper";
import { DecisionReasonPanel } from "../../components/claims/DecisionReasonPanel";
import { BasicFraudResult } from "../../components/claims/BasicFraudResult";
import type { ClaimFraudResult } from "../../components/claims/types";
import { apiGet, getUser } from "../../lib/api";
import { formatDateTimeIn, formatInr, humanizeSnakeCase } from "../../lib/formatting";
import type { ClaimDetailResponse, RegisterResponse } from "../../lib/types";

type StepperStatus = "submitted" | "verified" | "approved" | "paid" | "rejected";

type StepperDecision = "approved" | "rejected";

function normalizeRouteParam(idParam: string | string[] | undefined): string {
  if (Array.isArray(idParam)) {
    return idParam[0] ?? "";
  }
  return idParam || "";
}

function mapStatusForStepper(status: string): StepperStatus {
  const normalized = status.trim().toLowerCase();
  switch (normalized) {
    case "submitted":
      return "submitted";
    case "under_review":
      return "verified";
    case "approved":
      return "approved";
    case "paid":
      return "paid";
    case "rejected":
      return "rejected";
    default:
      return "submitted";
  }
}

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const claimID = normalizeRouteParam(params?.id);

  const [user, setUser] = useState<RegisterResponse | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [detail, setDetail] = useState<ClaimDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getUser());
      setSessionResolved(true);
    });
  }, []);

  const loadClaim = useCallback(async (sessionUser: RegisterResponse, signal?: AbortSignal) => {
    if (!claimID) {
      setError("Missing claim ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiGet<ClaimDetailResponse>(
        `/api/v1/claims/${encodeURIComponent(claimID)}?user_id=${encodeURIComponent(sessionUser.id)}`,
        signal,
      );
      setDetail(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load claim details.");
    } finally {
      setLoading(false);
    }
  }, [claimID]);

  useEffect(() => {
    if (!sessionResolved) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void loadClaim(user, controller.signal);
      }
    });

    return () => controller.abort();
  }, [loadClaim, router, sessionResolved, user]);

  const mappedStatus = mapStatusForStepper(detail?.status || "submitted");
  const mappedDecision: StepperDecision = detail?.decision === "auto_approve" ? "approved" : "rejected";

  const decisionAt = detail?.timeline.paid_at || detail?.timeline.approved_at || detail?.timeline.verified_at;

  const fraudView = useMemo<ClaimFraudResult | null>(() => {
    if (!detail) {
      return null;
    }

    const outcome: ClaimFraudResult["outcome"] =
      detail.fraud_output.outcome === "pass" ? "pass" : "fail";

    return {
      score: detail.fraud_output.normalized_score,
      outcome,
      threshold: detail.fraud_output.threshold,
      modelVersion: detail.fraud_output.model_version,
      evaluatedAt: detail.fraud_output.evaluated_at,
    };
  }, [detail]);

  if (!sessionResolved) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <PageShell>
        <div className="max-w-6xl mx-auto px-5 py-8 pb-24 md:pb-8">
          <div className="premium-card p-8 animate-pulse space-y-4">
            <div className="h-4 bg-gray-100 rounded w-40" />
            <div className="h-8 bg-gray-100 rounded w-64" />
            <div className="h-44 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !detail) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto px-5 py-10 pb-24 md:pb-8">
          <div className="premium-card p-6 space-y-4">
            <h1 className="text-xl font-bold text-gray-900">Unable to load claim</h1>
            <p className="text-sm text-gray-600">{error || "Claim details are unavailable right now."}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadClaim(user)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white hover:bg-electric-600 transition-colors"
              >
                <RefreshCw size={14} /> Retry
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-6">
        <header className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric">Parametric Claim Detail</p>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Claim {detail.claim_id}</h1>
              <p className="text-sm text-gray-600 mt-1">Transparent lifecycle, decision rationale, and fraud output from backend.</p>
            </div>

            <span
              className={`text-[11px] uppercase tracking-wider font-semibold rounded-full px-3 py-1.5 border ${
                mappedDecision === "approved"
                  ? "bg-teal-50 border-teal-200 text-teal-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {mappedDecision}
            </span>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article className="premium-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Claim Amount</p>
            <p className="text-xl font-bold mt-1 text-gray-900">{formatInr(detail.claim_amount)}</p>
            <p className="text-xs text-gray-600 mt-1 capitalize">Event: {humanizeSnakeCase(detail.event_type)}</p>
          </article>

          <article className="premium-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Payout</p>
            <p className="text-xl font-bold mt-1 text-teal-600">{formatInr(detail.payout_amount)}</p>
            <p className="text-xs text-gray-600 mt-1">Worker: {detail.worker_id}</p>
          </article>

          <article className="premium-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Submitted At</p>
            <p className="text-sm font-bold mt-1 text-gray-900">{formatDateTimeIn(detail.timeline.submitted_at)}</p>
            <p className="text-xs text-gray-600 mt-1 capitalize">Zone: {humanizeSnakeCase(detail.zone)}</p>
          </article>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <ClaimLifecycleStepper
              status={mappedStatus}
              decision={mappedDecision}
              timeline={{
                submittedAt: detail.timeline.submitted_at,
                verifiedAt: detail.timeline.verified_at,
                approvedAt: detail.timeline.approved_at,
                paidAt: detail.timeline.paid_at,
              }}
            />

            <DecisionReasonPanel
              decision={mappedDecision}
              summary={detail.decision_summary}
              reasons={detail.decision_reasons}
              claimAmount={detail.claim_amount}
              payoutAmount={detail.payout_amount}
              decidedAt={decisionAt}
            />

            <section className="premium-card p-6 space-y-3">
              <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold">Next Action</p>
              <p className="text-sm text-gray-700">{detail.next_action.replaceAll("_", " ")}</p>
            </section>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {fraudView && <BasicFraudResult fraud={fraudView} />}

            <section className="premium-card p-5">
              <h3 className="text-sm font-bold tracking-wider text-gray-700 uppercase mb-4">Attached Evidence</h3>
              <div className="space-y-3">
                {detail.evidence.length === 0 ? (
                  <p className="text-xs text-gray-500">No evidence records were attached for this claim.</p>
                ) : (
                  detail.evidence.map((evidence) => (
                    <div key={`${evidence.type}-${evidence.value || evidence.title}`} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-800">{evidence.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{evidence.source}</p>
                      {evidence.value && <p className="text-[11px] text-gray-700 mt-1">{evidence.value}</p>}
                      {evidence.timestamp && (
                        <p className="text-[10px] text-gray-400 mt-1">{formatDateTimeIn(evidence.timestamp)}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="premium-card p-6 space-y-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold">Claim Integrity</p>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-800 inline-flex items-center gap-2">
                  <ShieldCheck size={15} className="text-teal-500" /> Decision trail preserved
                </p>
                <p className="text-sm font-medium text-gray-800 inline-flex items-center gap-2">
                  <FileBadge2 size={15} className="text-electric" /> Fraud evaluation output attached
                </p>
                <p className="text-sm font-medium text-gray-800 inline-flex items-center gap-2">
                  <CalendarClock size={15} className="text-amber-500" />
                  Last update: {formatDateTimeIn(detail.timeline.last_updated_at)}
                </p>
              </div>
              {detail.fraud_output.risk_flags.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-800 inline-flex items-center gap-1.5">
                    <AlertCircle size={12} /> Risk Flags
                  </p>
                  <p className="text-xs text-amber-700 mt-1">{detail.fraud_output.risk_flags.join(", ")}</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
