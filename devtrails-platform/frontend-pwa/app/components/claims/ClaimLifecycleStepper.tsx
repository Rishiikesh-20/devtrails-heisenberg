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
  submitted: 0,
  verified: 1,
  approved: 2,
  rejected: 2,
  paid: 3,
};

function formatDateTime(value?: string): string {
  if (!value) {
    return "Pending";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveStepState(status: ClaimStatus, key: LifecycleStep["key"], index: number): StepState {
  const currentIndex = stageRank[status];

  if (status === "paid") {
    return "completed";
  }

  if (index < currentIndex) {
    return "completed";
  }

  if (index > currentIndex) {
    return "pending";
  }

  if (status === "rejected" && key === "approved") {
    return "failed";
  }

  return "current";
}

function iconForState(state: StepState) {
  if (state === "completed") {
    return <CheckCircle2 size={16} className="text-teal-300" />;
  }
  if (state === "failed") {
    return <XCircle size={16} className="text-red-300" />;
  }
  if (state === "current") {
    return <Clock3 size={16} className="text-electric" />;
  }
  return <Circle size={16} className="text-white/30" />;
}

function badgeForState(state: StepState, decision: ClaimDecision): { label: string; className: string } {
  if (state === "completed") {
    return {
      label: "Done",
      className: "bg-teal-500/12 text-teal-200 border border-teal-400/25",
    };
  }
  if (state === "failed") {
    return {
      label: decision === "rejected" ? "Rejected" : "Failed",
      className: "bg-red-500/12 text-red-200 border border-red-400/30",
    };
  }
  if (state === "current") {
    return {
      label: "In Progress",
      className: "bg-electric/15 text-blue-200 border border-electric/30",
    };
  }
  return {
    label: "Waiting",
    className: "bg-white/6 text-white/60 border border-white/12",
  };
}

export function ClaimLifecycleStepper({ status, decision, timeline }: ClaimLifecycleStepperProps) {
  const steps: LifecycleStep[] = [
    {
      key: "submitted",
      label: "Submitted",
      timestamp: timeline.submittedAt,
      state: resolveStepState(status, "submitted", 0),
    },
    {
      key: "verified",
      label: "Verified",
      timestamp: timeline.verifiedAt,
      state: resolveStepState(status, "verified", 1),
    },
    {
      key: "approved",
      label: "Approved",
      timestamp: timeline.approvedAt,
      state: resolveStepState(status, "approved", 2),
    },
    {
      key: "paid",
      label: "Paid",
      timestamp: timeline.paidAt,
      state: resolveStepState(status, "paid", 3),
    },
  ];

  return (
    <section className="glass-card rounded-2xl p-6">
      <header className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold mb-2">Claim Lifecycle</p>
        <h2 className="text-lg font-semibold">Submitted to payout progression</h2>
      </header>

      <ol className="space-y-4">
        {steps.map((step, index) => {
          const badge = badgeForState(step.state, decision);
          return (
            <li key={step.key} className="relative pl-8">
              {index < steps.length - 1 && (
                <span className="absolute left-[7px] top-5 h-[calc(100%+8px)] w-px bg-white/12" />
              )}

              <span className="absolute left-0 top-1">{iconForState(step.state)}</span>

              <div className="rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p className="text-xs text-white/45 mt-0.5">{formatDateTime(step.timestamp)}</p>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-semibold ${badge.className}`}>
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
