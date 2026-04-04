export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export type PricingBreakdown = {
  base_price: number;
  ai_risk_discount: number;
  final_premium: number;
  reason: string;
};

export type SessionUser = {
  id: string;
  email: string;
  full_name: string;
  zone: string;
  shift_start: string;
  shift_end: string;
  tier: number;
  weekly_premium: number;
  wage_per_hour?: number;
  pricing_breakdown: PricingBreakdown;
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

export type WeatherSignal = {
  id: string;
  zone: string;
  event_type: string;
  threshold_crossed: boolean;
  severity_factor: number;
  precipitation_mm: number;
  polled_at: string;
};

export type WeatherListResponse = {
  data: WeatherSignal[];
  count: number;
};

export type RiskQuoteResponse = {
  zone: string;
  shift_start: string;
  shift_end: string;
  tier: number;
  weekly_premium: number;
  pricing_breakdown: PricingBreakdown;
};

export type SimulateDisruptionResponse = {
  message: string;
  event_id: string;
  event_type: string;
  zone_id: string;
  severity_factor: number;
  triggered_at: string;
};

export type DemoBootstrapConfig = {
  email: string;
  fullName: string;
  zone: string;
  shiftStart: string;
  shiftEnd: string;
  password: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseError(body: unknown, fallback: string): { message: string; details?: string } {
  if (!isRecord(body)) {
    return { message: fallback };
  }

  const maybeMessage = body.error;
  const maybeDetails = body.details;

  return {
    message: typeof maybeMessage === "string" && maybeMessage.trim() !== "" ? maybeMessage : fallback,
    details: typeof maybeDetails === "string" && maybeDetails.trim() !== "" ? maybeDetails : undefined,
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const raw = await res.text();
  let body: unknown = {};

  if (raw) {
    try {
      body = JSON.parse(raw) as unknown;
    } catch {
      body = {};
    }
  }

  if (!res.ok) {
    const parsed = parseError(body, `Request failed (${res.status})`);
    throw new ApiError(parsed.message, res.status, parsed.details);
  }

  return body as T;
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  return handleResponse<T>(res);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  return handleResponse<T>(res);
}

export async function ensureDemoUser(
  config: DemoBootstrapConfig,
  signal?: AbortSignal,
): Promise<SessionUser> {
  const loginPayload = {
    email: config.email,
    password: config.password,
  };

  try {
    return await apiPost<SessionUser>("/api/v1/login", loginPayload, signal);
  } catch {
    // Fall through to registration for first-time bootstrapping.
  }

  const registerPayload = {
    email: config.email,
    full_name: config.fullName,
    zone: config.zone,
    shift_start: config.shiftStart,
    shift_end: config.shiftEnd,
  };

  try {
    return await apiPost<SessionUser>("/api/v1/register", registerPayload, signal);
  } catch {
    // Handle races where another client created the same demo user.
    return apiPost<SessionUser>("/api/v1/login", loginPayload, signal);
  }
}
