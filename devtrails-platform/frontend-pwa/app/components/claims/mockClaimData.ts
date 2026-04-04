import type { ClaimMockData } from "./types";

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function isRejectedClaim(claimID: string): boolean {
  const normalized = claimID.toLowerCase();
  if (normalized.includes("rej") || normalized.includes("fail")) {
    return true;
  }

  const digits = normalized.replace(/\D/g, "");
  if (!digits) {
    return false;
  }

  return Number(digits.slice(-1)) % 2 === 0;
}

const approvedTemplate: ClaimMockData = {
  id: "CLM-2026-00127",
  policyId: "POL-WKL-4478",
  zone: "South Delhi",
  eventType: "Heavy Rain Disruption",
  claimAmount: 1450,
  payoutAmount: 1450,
  status: "paid",
  decision: "approved",
  decisionSummary: "Claim approved under parametric weather trigger and paid automatically.",
  decisionReasons: [
    "Rainfall exceeded configured disruption threshold in insured zone.",
    "Worker was active during verified disruption window.",
    "No conflicting duplicate claim was detected for this event.",
  ],
  timeline: {
    submittedAt: minutesAgo(320),
    verifiedAt: minutesAgo(274),
    approvedAt: minutesAgo(230),
    paidAt: minutesAgo(185),
  },
  fraud: {
    score: 0.18,
    outcome: "pass",
    threshold: 0.65,
    modelVersion: "frs-v2.6",
    evaluatedAt: minutesAgo(232),
  },
};

const rejectedTemplate: ClaimMockData = {
  id: "CLM-2026-00128",
  policyId: "POL-WKL-4478",
  zone: "South Delhi",
  eventType: "Fuel Shortage Alert",
  claimAmount: 1180,
  payoutAmount: 0,
  status: "rejected",
  decision: "rejected",
  decisionSummary: "Claim rejected because verification signals did not satisfy payout criteria.",
  decisionReasons: [
    "Disruption signal confidence stayed below approval threshold.",
    "Location consistency checks indicated mismatch with reported zone.",
    "Fraud score exceeded risk tolerance for auto approval.",
  ],
  timeline: {
    submittedAt: minutesAgo(210),
    verifiedAt: minutesAgo(165),
  },
  fraud: {
    score: 0.81,
    outcome: "fail",
    threshold: 0.65,
    modelVersion: "frs-v2.6",
    evaluatedAt: minutesAgo(162),
  },
};

export function getMockClaimById(claimID: string): ClaimMockData {
  const trimmedID = claimID.trim() || approvedTemplate.id;
  const base = isRejectedClaim(trimmedID) ? rejectedTemplate : approvedTemplate;

  return {
    ...base,
    id: trimmedID,
  };
}
