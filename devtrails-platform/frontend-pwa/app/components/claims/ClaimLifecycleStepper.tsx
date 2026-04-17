import { CheckCircle2, Circle, Clock3, XCircle } from "lucide-react";
import type { ClaimDecision, ClaimStatus, ClaimTimeline } from "./types";

type ClaimLifecycleStepperProps = {
  status: ClaimStatus;
  decision: ClaimDecision;
  timeline: ClaimTimeline;
};

type StepState = "completed" | "current" | "pending" | "failed";

type LifecycleStep = {
  key: "submitted" | "verified" | "approved" | "paid";
  label: string;
  timestamp?: string;
  state: StepState;
};

const stageRank: Record<ClaimStatus, number> = {
  submitted: 0, verified: 1, approved: 2, rejected: 2, paid: 3,
};

function formatDateTime(value?: string): string {
  if (!value) return "Pending";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function resolveStepState(status: ClaimStatus, key: LifecycleStep["key"], index: number): StepState {
  const currentIndex = stageRank[status];
  if (status === "paid") return "completed";
  if (index < currentIndex) return "completed";
  if (index > currentIndex) return "pending";
  if (status === "rejected" && key === "approved") return "failed";
  return "current";
}

function iconForState(state: StepState) {
  if (state === "completed") return <CheckCircle2 size={16} className="text-teal-500" />;
  if (state === "failed") return <XCircle size={16} className="text-red-500" />;
  if (state === "current") return <Clock3 size={16} className="text-electric" />;
  return <Circle size={16} className="text-gray-300" />;
}

function badgeForState(state: StepState, decision: ClaimDecision): { label: string; className: string } {
  if (state === "completed") return {
    label: "Done",
    className: "bg-teal-50 text-teal-700 border border-teal-200",
  };
  if (state === "failed") return {
    label: decision === "rejected" ? "Rejected" : "Failed",
    className: "bg-red-50 text-red-700 border border-red-200",
  };
  if (state === "current") return {
    label: "In Progress",
    className: "bg-electric/8 text-electric border border-electric/20",
  };
  return {
    label: "Waiting",
    className: "bg-gray-100 text-gray-500 border border-gray-200",
  };
}

export function ClaimLifecycleStepper({ status, decision, timeline }: ClaimLifecycleStepperProps) {
  const steps: LifecycleStep[] = [
    { key: "submitted", label: "Submitted", timestamp: timeline.submittedAt, state: resolveStepState(status, "submitted", 0) },
    { key: "verified", label: "Verified", timestamp: timeline.verifiedAt, state: resolveStepState(status, "verified", 1) },
    { key: "approved", label: "Approved", timestamp: timeline.approvedAt, state: resolveStepState(status, "approved", 2) },
    { key: "paid", label: "Paid", timestamp: timeline.paidAt, state: resolveStepState(status, "paid", 3) },
  ];

  return (
    <section className="premium-card p-6">
      <header className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold mb-1">
          Claim Lifecycle
        </p>
        <h2 className="text-lg font-bold text-gray-900">Submitted to payout progression</h2>
      </header>

      <ol className="space-y-3">
        {steps.map((step, index) => {
          const badge = badgeForState(step.state, decision);
          return (
            <li key={step.key} className="relative pl-8">
              {index < steps.length - 1 && (
                <span className="absolute left-[7px] top-5 h-[calc(100%+6px)] w-px bg-gray-200" />
              )}

              <span className="absolute left-0 top-1">{iconForState(step.state)}</span>

              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">{step.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(step.timestamp)}</p>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold shrink-0 ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
