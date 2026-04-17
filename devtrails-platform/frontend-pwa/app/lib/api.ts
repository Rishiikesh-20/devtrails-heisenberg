import {
  API_BASE_URL,
  REGISTRATION_KEY,
  ONBOARDING_KEY,
  SIGNUP_DRAFT_KEY,
} from "./constants";
import type { RegisterResponse, OnboardingPayload, SignupDraft } from "./types";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSessionUser(value: unknown): value is RegisterResponse {
  if (!isObjectRecord(value)) return false;
  const id = value.id;
  const email = value.email;
  const zone = value.zone;
  const tier = value.tier;

  return (
    typeof id === "string" &&
    id.length > 0 &&
    typeof email === "string" &&
    email.length > 0 &&
    typeof zone === "string" &&
    zone.length > 0 &&
    typeof tier === "number"
  );
}

function buildSessionHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const user = getUser();
  if (!user?.id) {
    return {};
  }

  const headers: Record<string, string> = {
    "X-User-ID": user.id,
  };
  if (user.role) {
    headers["X-User-Role"] = user.role;
  }

  return headers;
}

// ─── Generic fetchers ────────────────────────────────────
export class ApiError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      (body as Record<string, string>).error ?? `Request failed (${res.status})`;
    const details = (body as Record<string, string>).details;
    throw new ApiError(msg, res.status, details);
  }

  return body as T;
}

export async function apiGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const sessionHeaders = buildSessionHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json", ...sessionHeaders },
    signal,
  });
  return handleResponse<T>(res);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const sessionHeaders = buildSessionHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...sessionHeaders,
    },
    body: JSON.stringify(body),
    signal,
  });
  return handleResponse<T>(res);
}

// ─── Session helpers ─────────────────────────────────────
export function getUser(): RegisterResponse | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(REGISTRATION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return isSessionUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setUser(user: RegisterResponse) {
  sessionStorage.setItem(REGISTRATION_KEY, JSON.stringify(user));
}

export function getOnboarding(): OnboardingPayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(ONBOARDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingPayload;
  } catch {
    return null;
  }
}

export function setOnboarding(data: OnboardingPayload) {
  sessionStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
}

export function getSignupDraft(): SignupDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SIGNUP_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SignupDraft;
  } catch {
    return null;
  }
}

export function setSignupDraft(draft: SignupDraft) {
  sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft));
}

export function clearSession() {
  sessionStorage.removeItem(REGISTRATION_KEY);
  sessionStorage.removeItem(ONBOARDING_KEY);
  sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
}

export function isLoggedIn(): boolean {
  return getUser() !== null;
}
