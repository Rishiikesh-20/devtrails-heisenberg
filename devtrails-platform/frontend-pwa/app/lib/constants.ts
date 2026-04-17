// ─── Session Storage Keys ────────────────────────────────
export const REGISTRATION_KEY = "wagelock.registration";
export const ONBOARDING_KEY = "wagelock.onboarding";
export const SIGNUP_DRAFT_KEY = "wagelock.signup-draft";

// ─── API ─────────────────────────────────────────────────
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

// ─── Delivery Zones ──────────────────────────────────────
export type ZoneDefinition = {
  value: string;
  label: string;
  lat: number;
  lng: number;
};

export const DEFAULT_ZONE = "south_delhi";

export const ZONES: readonly ZoneDefinition[] = [
  { value: "south_delhi", label: "South Delhi", lat: 28.5273, lng: 77.2218 },
  { value: "north_delhi", label: "North Delhi", lat: 28.7346, lng: 77.1310 },
  { value: "east_delhi", label: "East Delhi", lat: 28.6328, lng: 77.2872 },
  { value: "west_delhi", label: "West Delhi", lat: 28.6517, lng: 77.0911 },
  { value: "koramangala_blr", label: "Koramangala, Bengaluru", lat: 12.9279, lng: 77.6271 },
  { value: "hsr_layout_blr", label: "HSR Layout, Bengaluru", lat: 12.9116, lng: 77.6474 },
  { value: "indiranagar_blr", label: "Indiranagar, Bengaluru", lat: 12.9784, lng: 77.6408 },
  { value: "hitech_city_hyd", label: "HITEC City, Hyderabad", lat: 17.4435, lng: 78.3772 },
  { value: "madhapur_hyd", label: "Madhapur, Hyderabad", lat: 17.4496, lng: 78.3915 },
  { value: "t_nagar_che", label: "T Nagar, Chennai", lat: 13.0418, lng: 80.2341 },
  { value: "anna_nagar_che", label: "Anna Nagar, Chennai", lat: 13.0878, lng: 80.2102 },
  { value: "andheri_mum", label: "Andheri, Mumbai", lat: 19.1136, lng: 72.8697 },
  { value: "bandra_mum", label: "Bandra, Mumbai", lat: 19.0596, lng: 72.8295 },
  { value: "powai_mum", label: "Powai, Mumbai", lat: 19.1197, lng: 72.9059 },
  { value: "salt_lake_kol", label: "Salt Lake, Kolkata", lat: 22.5763, lng: 88.4310 },
  { value: "aundh_pune", label: "Aundh, Pune", lat: 18.5590, lng: 73.8078 },
  { value: "koregaon_park_pune", label: "Koregaon Park, Pune", lat: 18.5362, lng: 73.8959 },
  { value: "coimbatore", label: "Coimbatore", lat: 11.0168, lng: 76.9558 },
] as const;

export function getZoneByValue(zone: string | null | undefined): ZoneDefinition {
  const normalized = (zone ?? "").trim().toLowerCase();
  return ZONES.find((z) => z.value === normalized) ?? ZONES[0];
}

export function nearestZoneFromCoordinates(lat: number, lng: number): ZoneDefinition {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const haversine = (a: ZoneDefinition) => {
    const dLat = toRad(a.lat - lat);
    const dLng = toRad(a.lng - lng);
    const lat1 = toRad(lat);
    const lat2 = toRad(a.lat);
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const arc = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
    return 2 * 6371 * Math.asin(Math.sqrt(arc));
  };

  return ZONES.reduce((closest, candidate) => {
    const closestDistance = haversine(closest);
    const candidateDistance = haversine(candidate);
    return candidateDistance < closestDistance ? candidate : closest;
  }, ZONES[0]);
}

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
  {
    name: string;
    color: string;
    maxPayout: string;
    weeklyPremium: number;
    tagline: string;
    eventsCovered: string[];
  }
> = {
  1: {
    name: "Standard",
    color: "#14B8A6",
    maxPayout: "₹900/week",
    weeklyPremium: 79,
    tagline: "Core weather + outage coverage",
    eventsCovered: [
      "Heavy Rain / Extreme Weather",
      "Platform Outage",
    ],
  },
  2: {
    name: "Elevated",
    color: "#F59E0B",
    maxPayout: "₹1,600/week",
    weeklyPremium: 129,
    tagline: "Adds curfew + traffic protections",
    eventsCovered: [
      "Heavy Rain / Extreme Weather",
      "Platform Outage",
      "Curfew / Section 144",
      "Festival Traffic",
    ],
  },
  3: {
    name: "High Risk",
    color: "#EF4444",
    maxPayout: "₹2,500/week",
    weeklyPremium: 179,
    tagline: "Full spectrum with fuel shortage",
    eventsCovered: [
      "Heavy Rain / Extreme Weather",
      "Platform Outage",
      "Curfew / Section 144",
      "Festival Traffic",
      "Fuel / LPG Shortage",
    ],
  },
};
