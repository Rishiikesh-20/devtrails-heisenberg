import { Gauge, IndianRupee, Layers3 } from "lucide-react";
import { formatInr } from "./policyFormatters";

type CoverageCapsCardProps = {
  maxPayout: number;
  remainingCoverage: number;
  claimsPaidThisCycle: number;
};

export function CoverageCapsCard({
  maxPayout,
  remainingCoverage,
  claimsPaidThisCycle,
}: CoverageCapsCardProps) {
  const normalizedMax = Math.max(maxPayout, 1);
  const normalizedRemaining = Math.min(Math.max(remainingCoverage, 0), normalizedMax);
  const usedCoverage = normalizedMax - normalizedRemaining;
  const usedPercent = Math.min(Math.round((usedCoverage / normalizedMax) * 100), 100);

  return (
    <section className="glass-card rounded-2xl p-6 space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold mb-2">
            Coverage Caps
          </p>
          <h3 className="text-lg font-semibold">Weekly payout envelope</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
          <Gauge size={18} className="text-electric" />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/45 mb-1">Max Weekly Payout</p>
          <p className="text-xl font-bold flex items-center gap-1">
            <IndianRupee size={15} className="text-teal-300" />
            {formatInr(normalizedMax).replace("₹", "")}
          </p>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/45 mb-1">Remaining Coverage</p>
          <p className="text-xl font-bold text-teal-200">{formatInr(normalizedRemaining)}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs text-white/60 mb-2">
          <span>Used this week: {formatInr(usedCoverage)}</span>
          <span>{usedPercent}% utilized</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-electric transition-all"
            style={{ width: `${usedPercent}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-white/50 inline-flex items-center gap-1.5">
        <Layers3 size={13} className="text-white/35" />
        Claims paid this cycle: {claimsPaidThisCycle}
      </p>
    </section>
  );
}
