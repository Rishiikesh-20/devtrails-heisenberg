import { CalendarClock, PauseCircle, ShieldX, Sparkles } from "lucide-react";
import { formatLongDate } from "./policyFormatters";

type RenewalActionsPanelProps = {
  nextRenewalDate: string;
  autoRenewEnabled: boolean;
  onRenew: () => void;
  onPause: () => void;
  onCancel: () => void;
  busyAction?: "renew" | "pause" | "cancel" | null;
  disabled?: boolean;
};

export function RenewalActionsPanel({
  nextRenewalDate,
  autoRenewEnabled,
  onRenew,
  onPause,
  onCancel,
  busyAction = null,
  disabled = false,
}: RenewalActionsPanelProps) {
  return (
    <section className="premium-card p-6 space-y-4">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold mb-2">
          Renewal Actions
        </p>
        <h3 className="text-lg font-bold text-gray-900">Manage policy lifecycle</h3>
      </header>

      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm">
        <p className="inline-flex items-center gap-2 font-semibold text-gray-900">
          <CalendarClock size={15} className="text-teal-500" />
          Next renewal: {formatLongDate(nextRenewalDate)}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Auto-renew is {autoRenewEnabled ? "enabled" : "paused"} for this policy.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onRenew}
          disabled={disabled || busyAction !== null}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-sm bg-electric hover:bg-electric-600 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Sparkles size={14} />
          {busyAction === "renew" ? "Renewing..." : "Renew"}
        </button>

        <button
          type="button"
          onClick={onPause}
          disabled={disabled || busyAction !== null}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-sm border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <PauseCircle size={14} />
          {busyAction === "pause" ? "Pausing..." : "Pause"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={disabled || busyAction !== null}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-sm border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <ShieldX size={14} />
          {busyAction === "cancel" ? "Cancelling..." : "Cancel"}
        </button>
      </div>

      <p className="text-[11px] text-gray-400">Changes apply immediately to your backend policy record.</p>
    </section>
  );
}
