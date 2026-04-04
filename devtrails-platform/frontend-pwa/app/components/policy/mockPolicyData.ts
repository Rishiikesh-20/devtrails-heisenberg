import type { WorkerPolicySnapshot } from "./types";

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toIsoAtHour(date: Date, hour = 8): string {
  const iso = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hour,
      0,
      0,
      0,
    ),
  );
  return iso.toISOString();
}

function getCurrentCycleDates(): { cycleStart: string; cycleEnd: string; nextRenewalDate: string } {
  const now = new Date();
  const mondayIndex = (now.getDay() + 6) % 7;
  const cycleStartDate = addDays(now, -mondayIndex);
  const cycleEndDate = addDays(cycleStartDate, 6);
  const renewalDate = addDays(cycleEndDate, 1);

  return {
    cycleStart: toIsoAtHour(cycleStartDate, 5),
    cycleEnd: toIsoAtHour(cycleEndDate, 22),
    nextRenewalDate: toIsoAtHour(renewalDate, 7),
  };
}

const cycle = getCurrentCycleDates();

export const mockWorkerPolicy: WorkerPolicySnapshot = {
  policyNumber: "WLK-DEL-2026-004219",
  planName: "Weekly Shield Plus",
  zoneLabel: "South Delhi",
  status: "active",
  weeklyPremium: 179,
  cycleStart: cycle.cycleStart,
  cycleEnd: cycle.cycleEnd,
  nextRenewalDate: cycle.nextRenewalDate,
  autoRenewEnabled: true,
  waitingPeriod: {
    applies: true,
    reason: "Fuel shortage rider activates for new signups after 48 hours.",
    endsAt: addDays(new Date(), 2).toISOString(),
  },
  caps: {
    maxPayout: 3000,
    remainingCoverage: 1840,
    claimsPaidThisCycle: 2,
  },
};
