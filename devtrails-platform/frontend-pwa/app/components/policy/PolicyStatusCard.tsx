import { BadgeCheck, CalendarClock, CircleDot, Clock3 } from "lucide-react";
import { formatInr, formatLongDate } from "./policyFormatters";
import type { PolicyStatus } from "./types";

type PolicyStatusCardProps = {
  planName: string;
  policyNumber: string;
  zoneLabel: string;
  status: PolicyStatus;
  weeklyPremium: number;
  nextRenewalDate: string;
};

const statusTheme: Record<PolicyStatus, { label: string; className: string; description: string }> = {
  active: {
    label: "Active",
    className: "bg-teal-500/15 text-teal-300 border border-teal-400/30",
    description: "Coverage is currently protecting this worker.",
  },
  waiting: {
    label: "Waiting",
    className: "bg-amber-500/15 text-amber-300 border border-amber-400/30",
    description: "Policy is purchased but still in waiting period.",
  },
  expired: {
    label: "Expired",
    className: "bg-red-500/15 text-red-300 border border-red-400/30",
    description: "Coverage is inactive until the next renewal.",
  },
};

export function PolicyStatusCard({
  planName,
  policyNumber,
  zoneLabel,
  status,
  weeklyPremium,
  nextRenewalDate,
}: PolicyStatusCardProps) {
  const theme = statusTheme[status];

  return (
    <section className="glass-card rounded-2xl p-6 space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold mb-2">
            Policy Status
          </p>
          <h2 className="text-xl font-bold tracking-tight">{planName}</h2>
          <p className="text-sm text-white/45 mt-1">{policyNumber} · {zoneLabel}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
          <BadgeCheck size={18} className="text-electric" />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${theme.className}`}>
          {theme.label}
        </span>
        <span className="text-xs text-white/45">{theme.description}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/45 mb-1">Weekly Premium</p>
          <p className="text-lg font-semibold">{formatInr(weeklyPremium)}</p>
          <p className="text-[11px] text-white/45 mt-1">Auto debited every renewal cycle</p>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/45 mb-1">Next Renewal</p>
          <p className="text-sm font-semibold flex items-center gap-2">
            <CalendarClock size={14} className="text-teal-300" />
            {formatLongDate(nextRenewalDate)}
          </p>
          <p className="text-[11px] text-white/45 mt-1">Coverage refresh starts at 07:00 IST</p>
        </div>
      </div>

      <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4">
        <p className="text-[10px] uppercase tracking-wider text-white/45 mb-2">Status Legend</p>
        <div className="flex flex-wrap gap-3 text-xs text-white/60">
          <span className="inline-flex items-center gap-1.5">
            <CircleDot size={12} className="text-teal-300" /> Active
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={12} className="text-amber-300" /> Waiting
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CircleDot size={12} className="text-red-300" /> Expired
          </span>
        </div>
      </div>
    </section>
  );
}
