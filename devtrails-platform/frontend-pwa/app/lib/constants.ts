// ─── Session Storage Keys ────────────────────────────────
export const REGISTRATION_KEY = "wagelock.registration";
export const ONBOARDING_KEY = "wagelock.onboarding";
export const SIGNUP_DRAFT_KEY = "wagelock.signup-draft";

// ─── API ─────────────────────────────────────────────────
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

// ─── Delivery Zones ──────────────────────────────────────
export const ZONES = [
  { value: "south_delhi", label: "South Delhi" },
  { value: "north_delhi", label: "North Delhi" },
  { value: "east_delhi", label: "East Delhi" },
  { value: "west_delhi", label: "West Delhi" },
  { value: "koramangala_blr", label: "Koramangala, Bengaluru" },
  { value: "hsr_layout_blr", label: "HSR Layout, Bengaluru" },
  { value: "indiranagar_blr", label: "Indiranagar, Bengaluru" },
  { value: "hitech_city_hyd", label: "HITEC City, Hyderabad" },
  { value: "madhapur_hyd", label: "Madhapur, Hyderabad" },
  { value: "t_nagar_che", label: "T Nagar, Chennai" },
  { value: "anna_nagar_che", label: "Anna Nagar, Chennai" },
  { value: "andheri_mum", label: "Andheri, Mumbai" },
  { value: "bandra_mum", label: "Bandra, Mumbai" },
  { value: "powai_mum", label: "Powai, Mumbai" },
  { value: "salt_lake_kol", label: "Salt Lake, Kolkata" },
  { value: "aundh_pune", label: "Aundh, Pune" },
  { value: "koregaon_park_pune", label: "Koregaon Park, Pune" },
] as const;

// ─── Report Categories ───────────────────────────────────
export const REPORT_CATEGORIES = [
  { value: "weather", label: "Extreme Weather", icon: "CloudRain" },
  { value: "platform_outage", label: "Platform Outage", icon: "ServerOff" },
  { value: "curfew", label: "Curfew / Section 144", icon: "ShieldAlert" },
  { value: "traffic", label: "Traffic / Road Closure", icon: "TrafficCone" },
  { value: "fuel_shortage", label: "Fuel / LPG Shortage", icon: "Fuel" },
] as const;

// ─── Coverage Scenarios ──────────────────────────────────
export const COVERAGE_SCENARIOS = [
  { label: "Extreme Weather Events", icon: "CloudRain" },
  { label: "Food Delivery Platform Outage", icon: "ServerOff" },
  { label: "Curfew or Law Enforcement", icon: "ShieldAlert" },
  { label: "Festival Traffic Congestion", icon: "TrafficCone" },
  { label: "Fuel Shortage (LPG / Petrol)", icon: "Fuel" },
] as const;

// ─── Tier Labels ─────────────────────────────────────────
export const TIER_INFO: Record<
  number,
  { name: string; color: string; maxPayout: string }
> = {
  1: { name: "Standard", color: "#14B8A6", maxPayout: "₹900/week" },
  2: { name: "Elevated", color: "#F59E0B", maxPayout: "₹1,600/week" },
  3: { name: "High Risk", color: "#EF4444", maxPayout: "₹2,500/week" },
};
