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
  pricing_breakdown: PricingBreakdown;
};

export type OnboardingPayload = {
  email: string;
  full_name: string;
  zone: string;
  shift_start: string;
  shift_end: string;
};
