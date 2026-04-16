import { CheckCircle2, Dot } from "lucide-react";
import { formatDayAndMonth, formatDayLabel, toDayKey } from "./policyFormatters";
import type { PolicyStatus } from "./types";

type WeeklyCycleTimelineProps = {
  cycleStart: string;
  status: PolicyStatus;
  waitingPeriodEndsAt?: string;
};

type TimelineDay = {
  dateIso: string;
  covered: boolean;
  current: boolean;
  waiting: boolean;
};

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function buildTimeline(cycleStart: string, waitingPeriodEndsAt?: string): TimelineDay[] {
  const start = new Date(cycleStart);
  const todayKey = toDayKey(new Date());
  const waitingEndKey = waitingPeriodEndsAt ? toDayKey(waitingPeriodEndsAt) : "";

  return Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(start, index);
    const dateIso = date.toISOString();
    const key = toDayKey(date);
    const waiting = Boolean(waitingEndKey && key <= waitingEndKey);
    return { dateIso, current: key === todayKey, covered: key <= todayKey, waiting };
  });
}

export function WeeklyCycleTimeline({ cycleStart, status, waitingPeriodEndsAt }: WeeklyCycleTimelineProps) {
  const days = buildTimeline(cycleStart, waitingPeriodEndsAt);

  return (
    <section className="premium-card p-6">
      <header className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-electric font-semibold mb-1">
          Weekly Coverage Cycle
        </p>
        <h3 className="text-lg font-bold text-gray-900">Current 7-day protection window</h3>
      </header>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[680px] grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dayStatus = status === "expired"
              ? "Expired"
              : day.waiting ? "Waiting"
              : day.covered ? "Covered"
              : "Upcoming";

            return (
              <article
                key={day.dateIso}
                className={`relative rounded-xl border p-3 transition-colors ${
                  day.current
                    ? "border-electric/40 bg-electric/8"
                    : day.covered
                      ? "border-teal-200 bg-teal-50"
                      : "border-gray-100 bg-gray-50"
                }`}
              >
                {index < 6 && (
                  <span className="pointer-events-none absolute top-6 -right-2.5 text-gray-300">
                    <Dot size={20} />
                  </span>
                )}
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                  {formatDayLabel(day.dateIso)}
                </p>
                <p className="text-sm font-bold text-gray-900 mt-1">{formatDayAndMonth(day.dateIso)}</p>
                <p className={`text-xs mt-2 flex items-center gap-1.5 font-medium ${
                  dayStatus === "Covered" ? "text-teal-600"
                    : dayStatus === "Waiting" ? "text-amber-600"
                    : dayStatus === "Expired" ? "text-red-500"
                    : "text-gray-400"
                }`}>
                  {dayStatus === "Covered" && <CheckCircle2 size={12} className="text-teal-500" />}
                  {dayStatus}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
