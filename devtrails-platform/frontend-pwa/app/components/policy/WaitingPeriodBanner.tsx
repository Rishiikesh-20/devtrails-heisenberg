import { AlertTriangle, Timer } from "lucide-react";
import { diffInWholeDays, formatLongDate } from "./policyFormatters";

type WaitingPeriodBannerProps = {
  applies: boolean;
  reason?: string;
  endsAt?: string;
};

export function WaitingPeriodBanner({ applies, reason, endsAt }: WaitingPeriodBannerProps) {
  if (!applies || !endsAt) return null;

  const nowIso = new Date().toISOString();
  const daysLeft = diffInWholeDays(nowIso, endsAt);
  if (daysLeft <= 0) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
          <AlertTriangle size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-800">Waiting period in effect</p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            {reason ?? "A temporary waiting period applies before full coverage is enabled."}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-amber-700">
            <span className="inline-flex items-center gap-1.5">
              <Timer size={13} /> {daysLeft} day{daysLeft === 1 ? "" : "s"} left
            </span>
            <span>Ends: {formatLongDate(endsAt)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
