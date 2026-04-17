export type PricingBreakdown = {
  base_price: number;
  ai_risk_discount: number;
  final_premium: number;
  reason: string;
};

export type PolicyStatus =
  | "pending"
  | "waiting"
  | "active"
  | "paused"
  | "cancelled"
  | "expired";

export type RegisterResponse = {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  zone: string;
  shift_start: string;
  shift_end: string;
  shift_status?: string;
  active?: boolean;
  tier: number;
  weekly_premium: number;
  wage_per_hour?: number;
  policy_number?: string;
  policy_status?: PolicyStatus;
  auto_renew_enabled?: boolean;
  policy_activated_at?: string | null;
  policy_waiting_until?: string | null;
  policy_cycle_start_at?: string | null;
  policy_cycle_end_at?: string | null;
  policy_next_renewal_at?: string | null;
  pricing_breakdown: PricingBreakdown;
};

export type ProfileResponse = RegisterResponse & {
  onboarding_completed?: boolean;
};

export type SignupResponse = {
  message: string;
  onboarding_required: boolean;
  user: RegisterResponse;
};

export type OnboardingPayload = {
  email: string;
  full_name: string;
  zone: string;
  shift_start: string;
  shift_end: string;
};

export type SignupDraft = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

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

export type PolicySnapshotResponse = {
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

export type PolicyActionResponse = {
  message: string;
  user: RegisterResponse;
  policy: PolicySnapshotResponse;
};

export type WalletResponse = {
  user_id: string;
  balance: number;
  currency: string;
  updated_at: string;
};

export type PaginationMeta = {
  limit: number;
  offset: number;
  returned: number;
  total: number;
  has_more: boolean;
};

export type WalletEntryItem = {
  entry_id: string;
  payout_id?: string;
  event_id: string;
  amount: number;
  entry_type: string;
  source: string;
  created_at: string;
};

export type WalletV1Response = {
  worker_id: string;
  currency: string;
  balance: number;
  updated_at: string;
  as_of: string;
  entries: WalletEntryItem[];
  pagination: PaginationMeta;
};

export type PayoutListItem = {
  payout_id: string;
  claim_id: string;
  event_id: string;
  amount: number;
  status: string;
  decision: string;
  created_at: string;
  processed_at: string | null;
  failure_reason?: string;
};

export type PayoutListResponse = {
  worker_id: string;
  currency: string;
  as_of: string;
  items: PayoutListItem[];
};

export type PayoutListV1Filters = {
  statuses?: string[];
  decisions?: string[];
  event_id?: string;
  from?: string;
  to?: string;
};

export type PayoutListV1Item = {
  payout_id: string;
  claim_id: string;
  event_id: string;
  worker_id: string;
  amount: number;
  currency: string;
  status: string;
  status_label: string;
  decision: string;
  decision_label: string;
  created_at: string;
  processed_at: string | null;
  failure_reason?: string;
  eta_minutes: number;
  next_action: string;
};

export type PayoutListV1Response = {
  worker_id: string;
  currency: string;
  as_of: string;
  pagination: PaginationMeta;
  filters: PayoutListV1Filters;
  items: PayoutListV1Item[];
};

export type PayoutSupportResponse = {
  worker_id: string;
  payout_id: string;
  status: string;
  status_label: string;
  eta_minutes: number;
  next_action: string;
  support_hint: string;
  failure_reason?: string;
};

export type ClaimListItem = {
  claim_id?: string;
  event_id: string;
  user_id: string;
  frs_score: number;
  decision: string;
  status: string;
  created_at: string;
};

export type ClaimListResponse = {
  user_id: string;
  items: ClaimListItem[];
};

export type ClaimListV1Filters = {
  statuses?: string[];
  decisions?: string[];
  event_id?: string;
  from?: string;
  to?: string;
};

export type ClaimListV1Item = {
  claim_id: string;
  event_id: string;
  worker_id: string;
  status: string;
  status_label: string;
  decision: string;
  decision_label: string;
  frs_score: number;
  risk_outcome: string;
  payout_id?: string;
  payout_status?: string;
  payout_amount: number;
  created_at: string;
};

export type ClaimListV1Response = {
  worker_id: string;
  as_of: string;
  pagination: PaginationMeta;
  filters: ClaimListV1Filters;
  items: ClaimListV1Item[];
};

export type ClaimDetailTimeline = {
  submitted_at: string;
  verified_at?: string;
  approved_at?: string;
  paid_at?: string;
  last_updated_at: string;
};

export type ClaimDetailFraudOutput = {
  frs_score: number;
  normalized_score: number;
  threshold: number;
  outcome: "pass" | "review" | "fail";
  decision: string;
  risk_flags: string[];
  model_version: string;
  evaluated_at: string;
};

export type ClaimDetailEvidence = {
  type: string;
  source: string;
  title: string;
  value?: string;
  timestamp?: string;
};

export type ClaimDetailResponse = {
  claim_id: string;
  event_id: string;
  worker_id: string;
  zone: string;
  event_type: string;
  status: string;
  status_label: string;
  decision: string;
  decision_label: string;
  claim_amount: number;
  payout_amount: number;
  currency: string;
  timeline: ClaimDetailTimeline;
  decision_summary: string;
  decision_reasons: string[];
  fraud_output: ClaimDetailFraudOutput;
  evidence: ClaimDetailEvidence[];
  next_action: string;
};

export type TierUpgradeResponse = {
  message: string;
  old_tier: number;
  new_tier: number;
  old_weekly_premium: number;
  new_weekly_premium: number;
  premium_delta: number;
  reason?: string;
  user: RegisterResponse;
};
