import { Activity, Shield } from "lucide-react";

type PolicyStatus = "active" | "waiting" | "expired";

type CurrentCoverageStatusCardProps = {
  status: PolicyStatus;
  coverageLeft: number;
  maxCoverage: number;
};

function coverageTone(percent: number): {
  label: string;
  dotClass: string;
  barClass: string;
  note: string;
} {
  if (percent > 60) {
    return {
      label: "Strong",
      dotClass: "bg-teal-400",
      barClass: "from-teal-400 to-electric",
      note: "Healthy protection buffer remains for this cycle.",
    };
  }
  if (percent > 30) {
    return {
      label: "Moderate",
      dotClass: "bg-amber-400",
      barClass: "from-amber-400 to-electric",
      note: "Coverage is stable but being consumed steadily.",
    };
  }
  return {
    label: "Low",
    dotClass: "bg-red-400",
    barClass: "from-red-400 to-amber-400",
    note: "Coverage is nearing cap and may exhaust soon.",
  };
}

export function CurrentCoverageStatusCard({
  status,
  coverageLeft,
  maxCoverage,
}: CurrentCoverageStatusCardProps) {
  const percent = Math.min(Math.round((Math.max(0, coverageLeft) / Math.max(maxCoverage, 1)) * 100), 100);
  const tone = coverageTone(percent);

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Current Coverage Status</p>
          <p className="text-base font-semibold">Protection Health Indicator</p>
        </div>
        <Shield size={18} className="text-electric" />
      </div>

      <div className="rounded-xl bg-white/4 border border-white/8 p-3">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="inline-flex items-center gap-2 text-white/70">
            <span className={`h-2 w-2 rounded-full ${tone.dotClass}`} /> {tone.label}
          </span>
          <span className="text-white/45">{percent}% left</span>
        </div>

        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${tone.barClass} transition-all`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="text-[11px] text-white/45 mt-2">{tone.note}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-white/45">
        <span className="inline-flex items-center gap-1.5"><Activity size={12} /> Policy state: {status}</span>
        <span>Cap: ₹{Math.max(0, maxCoverage).toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
