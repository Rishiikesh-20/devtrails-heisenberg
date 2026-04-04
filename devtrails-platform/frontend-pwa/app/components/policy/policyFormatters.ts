const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatInr(value: number): string {
  return currencyFormatter.format(Math.max(0, value));
}

export function formatLongDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDayLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IN", {
    weekday: "short",
  });
}

export function formatDayAndMonth(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function toDayKey(dateLike: string | Date): string {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
}

export function diffInWholeDays(fromIso: string, toIso: string): number {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const distance = to.getTime() - from.getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(Math.ceil(distance / msPerDay), 0);
}
