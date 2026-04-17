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
  pending: {
    label: "Pending",
    className: "bg-slate-100 text-slate-700 border border-slate-200",
    description: "Policy is created but not yet activated.",
  },
  active: {
    label: "Active",
    className: "bg-teal-50 text-teal-700 border border-teal-200",
    description: "Coverage is currently protecting this worker.",
  },
  waiting: {
    label: "Waiting",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    description: "Policy is purchased but still in waiting period.",
  },
  expired: {
    label: "Expired",
    className: "bg-red-50 text-red-700 border border-red-200",
    description: "Coverage is inactive until the next renewal.",
  },
  paused: {
    label: "Paused",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    description: "Coverage is paused and auto-renew is disabled.",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-50 text-rose-700 border border-rose-200",
    description: "Policy has been cancelled and no payouts will trigger.",
  },
};

export function PolicyStatusCard({
  planName, policyNumber, zoneLabel, status, weeklyPremium, nextRenewalDate,
}: PolicyStatusCardProps) {
  const theme = statusTheme[status];

  return (
    <section className="premium-card p-6 space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold mb-2">
            Policy Status
          </p>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">{planName}</h2>
          <p className="text-sm text-gray-500 mt-1">{policyNumber} · {zoneLabel}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-electric/8 flex items-center justify-center shrink-0">
          <BadgeCheck size={18} className="text-electric" />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${theme.className}`}>
          {theme.label}
        </span>
        <span className="text-xs text-gray-600">{theme.description}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Weekly Premium</p>
          <p className="text-lg font-bold text-gray-900">{formatInr(weeklyPremium)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Auto debited every renewal cycle</p>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Next Renewal</p>
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <CalendarClock size={14} className="text-teal-500" />
            {formatLongDate(nextRenewalDate)}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">Coverage refresh starts at 07:00 IST</p>
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Status Legend</p>
        <div className="flex flex-wrap gap-3 text-xs text-gray-700">
          <span className="inline-flex items-center gap-1.5">
            <CircleDot size={12} className="text-slate-500" /> Pending
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CircleDot size={12} className="text-teal-500" /> Active
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={12} className="text-amber-500" /> Waiting
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CircleDot size={12} className="text-amber-700" /> Paused
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CircleDot size={12} className="text-rose-600" /> Cancelled
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CircleDot size={12} className="text-red-500" /> Expired
          </span>
        </div>
      </div>
    </section>
  );
}
