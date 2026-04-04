import { CheckCircle2, CircleDollarSign, Clock3, LoaderCircle } from "lucide-react";
import type { ClaimListItem, PayoutListItem } from "../../lib/types";

type NextPayoutEtaCardProps = {
  payouts: PayoutListItem[];
  claims: ClaimListItem[];
  loading: boolean;
};

const terminalStatuses = new Set(["credited", "succeeded", "failed", "cancelled", "rejected"]);
const successfulStatuses = new Set(["credited", "succeeded"]);

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

function addMinutes(base: Date, mins: number): Date {
  const copy = new Date(base);
  copy.setMinutes(copy.getMinutes() + mins);
  return copy;
}

function formatRelative(eta: Date): string {
  const deltaMs = eta.getTime() - Date.now();
  if (deltaMs <= 0) return "Due now";
  const mins = Math.ceil(deltaMs / 60000);
  if (mins < 60) return `~${mins} min`;
  const hours = Math.ceil(mins / 60);
  return `~${hours} hr`;
}

function formatInr(value: number): string {
  return `₹${Math.max(0, value).toLocaleString("en-IN")}`;
}

function formatExactTime(value: Date): string {
  return value.toLocaleString("en-IN", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NextPayoutEtaCard({ payouts, claims, loading }: NextPayoutEtaCardProps) {
  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <div className="skeleton h-20 w-full" />
      </div>
    );
  }

  const pending = [...payouts]
    .filter((item) => !terminalStatuses.has(normalizeStatus(item.status)))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

  const creditedEventIds = new Set(
    payouts
      .filter((item) => successfulStatuses.has(normalizeStatus(item.status)))
      .map((item) => item.event_id),
  );

  const approvedUnpaidClaim = [...claims]
    .filter((item) => item.status === "approved" && !creditedEventIds.has(item.event_id))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];

  let label = "No payout currently queued";
  let subLabel = "New approved claims will appear here with ETA.";
  let amountLabel = "--";
  let etaText = "Awaiting trigger";
  let icon = <Clock3 size={16} className="text-white/40" />;

  if (pending) {
    const eta = addMinutes(new Date(pending.created_at), 90);
    label = "Next payout in processing";
    subLabel = `Payout ${pending.payout_id.slice(0, 8)}... is being settled.`;
    amountLabel = formatInr(pending.amount);
    etaText = `${formatRelative(eta)} · ${formatExactTime(eta)}`;
    icon = <LoaderCircle size={16} className="text-amber-300 animate-spin" />;
  } else if (approvedUnpaidClaim) {
    const eta = addMinutes(new Date(approvedUnpaidClaim.created_at), 120);
    label = "Claim approved, payout scheduled";
    subLabel = `Event ${approvedUnpaidClaim.event_id.slice(0, 8)}... is queued for credit.`;
    amountLabel = "Auto-calculated";
    etaText = `${formatRelative(eta)} · ${formatExactTime(eta)}`;
    icon = <CheckCircle2 size={16} className="text-teal-300" />;
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Next Payout ETA</p>
          <p className="text-base font-semibold">{label}</p>
        </div>
        <CircleDollarSign size={18} className="text-electric" />
      </div>

      <div className="rounded-xl bg-white/4 border border-white/8 p-3">
        <p className="text-[10px] uppercase tracking-wider text-white/35">Estimated Arrival</p>
        <p className="text-sm font-semibold mt-1 inline-flex items-center gap-1.5">
          {icon}
          {etaText}
        </p>
        <p className="text-[11px] text-white/45 mt-1">{subLabel}</p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-white/45">Expected Amount</span>
        <span className="font-semibold text-teal-200">{amountLabel}</span>
      </div>
    </div>
  );
}
