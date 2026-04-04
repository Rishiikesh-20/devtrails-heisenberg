export type PricingBreakdown = {
  base_price: number;
  ai_risk_discount: number;
  final_premium: number;
  reason: string;
};

export type RegisterResponse = {
  id: string;
  email: string;
  zone: string;
  tier: number;
  weekly_premium: number;
  wage_per_hour?: number;
  pricing_breakdown: PricingBreakdown;
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

export type WalletResponse = {
  user_id: string;
  balance: number;
  currency: string;
  updated_at: string;
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

export type ClaimListItem = {
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
