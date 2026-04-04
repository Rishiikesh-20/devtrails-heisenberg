import { CalendarClock, PauseCircle, ShieldX, Sparkles } from "lucide-react";
import { formatLongDate } from "./policyFormatters";

type RenewalActionsPanelProps = {
  nextRenewalDate: string;
  autoRenewEnabled: boolean;
};

export function RenewalActionsPanel({
  nextRenewalDate,
  autoRenewEnabled,
}: RenewalActionsPanelProps) {
  return (
    <section className="glass-card rounded-2xl p-6 space-y-4">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold mb-2">
          Renewal Actions
        </p>
        <h3 className="text-lg font-semibold">Manage policy lifecycle</h3>
      </header>

      <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 text-sm text-white/70">
        <p className="inline-flex items-center gap-2 font-medium text-white">
          <CalendarClock size={15} className="text-teal-300" />
          Next renewal: {formatLongDate(nextRenewalDate)}
        </p>
        <p className="text-xs text-white/50 mt-2">
          Auto-renew is {autoRenewEnabled ? "enabled" : "paused"} for this policy.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-sm bg-electric hover:bg-electric-600 transition-colors"
        >
          <Sparkles size={14} />
          Renew
        </button>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-sm border border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors"
        >
          <PauseCircle size={14} />
          Pause
        </button>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-sm border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 transition-colors"
        >
          <ShieldX size={14} />
          Cancel
        </button>
      </div>

      <p className="text-[11px] text-white/45">
        Action handlers can be connected to backend APIs when policy lifecycle endpoints are ready.
      </p>
    </section>
  );
}
