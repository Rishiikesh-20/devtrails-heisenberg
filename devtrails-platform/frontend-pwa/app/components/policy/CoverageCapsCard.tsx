import { Gauge, IndianRupee, Layers3 } from "lucide-react";
import { formatInr } from "./policyFormatters";

type CoverageCapsCardProps = {
  maxPayout: number;
  remainingCoverage: number;
  claimsPaidThisCycle: number;
};

export function CoverageCapsCard({ maxPayout, remainingCoverage, claimsPaidThisCycle }: CoverageCapsCardProps) {
  const normalizedMax = Math.max(maxPayout, 1);
  const normalizedRemaining = Math.min(Math.max(remainingCoverage, 0), normalizedMax);
  const usedCoverage = normalizedMax - normalizedRemaining;
  const usedPercent = Math.min(Math.round((usedCoverage / normalizedMax) * 100), 100);

  return (
    <section className="premium-card p-6 space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold mb-2">
            Coverage Caps
          </p>
          <h3 className="text-lg font-bold text-gray-900">Weekly payout envelope</h3>
        </div>
        <div className="w-10 h-10 rounded-xl bg-electric/8 flex items-center justify-center shrink-0">
          <Gauge size={18} className="text-electric" />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Max Weekly Payout</p>
          <p className="text-xl font-bold text-gray-900 flex items-center gap-1">
            <IndianRupee size={15} className="text-teal-600" />
            {formatInr(normalizedMax).replace("₹", "")}
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Remaining</p>
          <p className="text-xl font-bold text-teal-600">{formatInr(normalizedRemaining)}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-2">
          <span>Used: {formatInr(usedCoverage)}</span>
          <span>{usedPercent}% utilized</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-electric transition-all"
            style={{ width: `${usedPercent}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-600 inline-flex items-center gap-1.5">
        <Layers3 size={13} className="text-gray-400" />
        Claims paid this cycle: <span className="font-bold text-gray-900">{claimsPaidThisCycle}</span>
      </p>
    </section>
  );
}
