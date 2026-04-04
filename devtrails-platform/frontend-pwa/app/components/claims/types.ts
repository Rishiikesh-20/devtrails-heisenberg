export type ClaimStatus = "submitted" | "verified" | "approved" | "paid" | "rejected";

export type ClaimDecision = "approved" | "rejected";

export type FraudOutcome = "pass" | "fail";

export type ClaimTimeline = {
  submittedAt: string;
  verifiedAt?: string;
  approvedAt?: string;
  paidAt?: string;
};

export type ClaimFraudResult = {
  score: number;
  outcome: FraudOutcome;
  threshold: number;
  modelVersion: string;
  evaluatedAt: string;
};

export type ClaimMockData = {
  id: string;
  policyId: string;
  zone: string;
  eventType: string;
  claimAmount: number;
  payoutAmount: number;
  status: ClaimStatus;
  decision: ClaimDecision;
  decisionSummary: string;
  decisionReasons: string[];
  timeline: ClaimTimeline;
  fraud: ClaimFraudResult;
};
