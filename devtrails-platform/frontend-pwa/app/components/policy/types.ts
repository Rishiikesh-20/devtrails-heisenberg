export type PolicyStatus =
  | "pending"
  | "waiting"
  | "active"
  | "paused"
  | "cancelled"
  | "expired";

export type PolicyWaitingPeriod = {
  applies: boolean;
  reason?: string;
  endsAt?: string;
};

export type PolicyCoverageCaps = {
  maxPayout: number;
  remainingCoverage: number;
  claimsPaidThisCycle: number;
};

export type WorkerPolicySnapshot = {
  policyNumber: string;
  planName: string;
  zoneLabel: string;
  status: PolicyStatus;
  weeklyPremium: number;
  cycleStart: string;
  cycleEnd: string;
  nextRenewalDate: string;
  autoRenewEnabled: boolean;
  waitingPeriod: PolicyWaitingPeriod;
  caps: PolicyCoverageCaps;
};
