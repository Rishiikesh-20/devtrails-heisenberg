export function formatInr(amount: number, fractionDigits = 2): string {
  const normalized = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(normalized);
}

export function formatInrCompact(amount: number): string {
  const normalized = Number.isFinite(amount) ? amount : 0;
  return `INR ${Math.round(normalized).toLocaleString("en-IN")}`;
}

export function formatDateTimeIn(value?: string): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateIn(value?: string): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function humanizeSnakeCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Unknown";
  }

  return trimmed
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function payoutStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  switch (normalized) {
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "succeeded":
      return "Succeeded";
    case "credited":
      return "Credited";
    case "failed":
      return "Failed";
    default:
      return humanizeSnakeCase(normalized || "unknown");
  }
}

export function claimStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  switch (normalized) {
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "paid":
      return "Paid";
    default:
      return humanizeSnakeCase(normalized || "unknown");
  }
}

export function decisionLabel(decision: string): string {
  const normalized = decision.trim().toLowerCase();
  switch (normalized) {
    case "auto_approve":
      return "Auto Approved";
    case "partial_hold":
      return "Partial Hold";
    case "full_withhold":
      return "Full Withhold";
    default:
      return humanizeSnakeCase(normalized || "unknown");
  }
}

export function zoneLabel(zone: string): string {
  return humanizeSnakeCase(zone);
}
