import { CalendarClock, ShieldCheck, ShieldX, Timer } from "lucide-react";

type PolicyStatus = "active" | "waiting" | "expired";

type ActivePolicySnapshotCardProps = {
  status: PolicyStatus;
  coverageLeft: number;
  maxCoverage: number;
  weeklyPremium: number;
  nextRenewalAt: string;
};

const statusTheme: Record<PolicyStatus, { label: string; badgeClass: string; note: string }> = {
  active: {
    label: "Active",
    badgeClass: "bg-teal-500/15 text-teal-300 border border-teal-400/30",
    note: "Policy is fully protecting current disruption claims.",
  },
  waiting: {
    label: "Waiting",
    badgeClass: "bg-amber-500/15 text-amber-300 border border-amber-400/30",
    note: "Policy is set up and waiting for cycle activation.",
  },
  expired: {
    label: "Expired",
    badgeClass: "bg-red-500/15 text-red-300 border border-red-400/30",
    note: "Coverage is paused until weekly premium renewal.",
  },
};

function formatInr(value: number): string {
  return `₹${Math.max(0, value).toLocaleString("en-IN")}`;
}

function formatRenewalDate(value: string): string {
  const d = new Date(value);
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivePolicySnapshotCard({
  status,
  coverageLeft,
  maxCoverage,
  weeklyPremium,
  nextRenewalAt,
}: ActivePolicySnapshotCardProps) {
  const theme = statusTheme[status];
  const coverageRatio = Math.round((Math.max(0, coverageLeft) / Math.max(maxCoverage, 1)) * 100);

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Active Policy Snapshot</p>
          <p className="text-base font-semibold">Weekly Income Shield</p>
        </div>
        {status === "expired" ? (
          <ShieldX size={18} className="text-red-300" />
        ) : (
          <ShieldCheck size={18} className="text-electric" />
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2.5 py-1 ${theme.badgeClass}`}>
          {theme.label}
        </span>
        <span className="text-[11px] text-white/45">{theme.note}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/4 border border-white/8 p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Coverage Left</p>
          <p className="text-lg font-bold text-teal-200 mt-1">{formatInr(coverageLeft)}</p>
          <p className="text-[10px] text-white/35 mt-1">of {formatInr(maxCoverage)} weekly cap</p>
        </div>
        <div className="rounded-xl bg-white/4 border border-white/8 p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Weekly Premium</p>
          <p className="text-lg font-bold mt-1">{formatInr(weeklyPremium)}</p>
          <p className="text-[10px] text-white/35 mt-1">Auto-debited each cycle</p>
        </div>
      </div>

      <div className="rounded-xl bg-white/4 border border-white/8 p-3">
        <div className="flex items-center justify-between text-[10px] text-white/40 mb-2">
          <span className="inline-flex items-center gap-1.5"><Timer size={11} /> Coverage Utilization</span>
          <span>{Math.min(coverageRatio, 100)}% remaining</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-electric to-teal-400"
            style={{ width: `${Math.min(coverageRatio, 100)}%` }}
          />
        </div>
      </div>

      <p className="text-[11px] text-white/45 inline-flex items-center gap-1.5">
        <CalendarClock size={12} className="text-teal-300" /> Next renewal: {formatRenewalDate(nextRenewalAt)}
      </p>
    </div>
  );
}
