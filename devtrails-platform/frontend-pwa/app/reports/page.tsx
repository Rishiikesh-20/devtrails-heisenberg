"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CloudRain,
  ServerOff,
  ShieldAlert,
  TrafficCone,
  Fuel,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PageShell } from "../components/ui/PageShell";
import { useToast } from "../components/ui/ToastProvider";
import { apiGet, apiPost, getUser, getOnboarding } from "../lib/api";
import { REPORT_CATEGORIES } from "../lib/constants";

type Report = {
  id: string;
  user_id: string;
  zone: string;
  category: string;
  severity: number;
  details: string;
  status: string;
  authenticity_score: number;
  reported_at: string;
};

type ReportListResponse = {
  data: Report[];
  count: number;
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  weather: <CloudRain size={16} />,
  platform_outage: <ServerOff size={16} />,
  curfew: <ShieldAlert size={16} />,
  traffic: <TrafficCone size={16} />,
  fuel_shortage: <Fuel size={16} />,
};

const CATEGORY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  weather: { text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  platform_outage: { text: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
  curfew: { text: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  traffic: { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  fuel_shortage: { text: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" },
};

export default function ReportsPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  const [category, setCategory] = useState<string>(REPORT_CATEGORIES[0].value);
  const [severity, setSeverity] = useState(3);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const zoneRef = useRef("");

  const fetchReports = useCallback(
    async (signal?: AbortSignal) => {
      setLoadingReports(true);
      try {
        const res = await apiGet<ReportListResponse>(
          `/api/v1/reports?zone=${encodeURIComponent(zoneRef.current)}&limit=20`,
          signal,
        );
        setReports(res.data ?? []);
      } catch {
        // silent
      } finally {
        setLoadingReports(false);
      }
    },
    [],
  );

  useEffect(() => {
    const u = getUser();
    const ob = getOnboarding();
    setUser(u);
    zoneRef.current = u?.zone ?? ob?.zone ?? "";
    setMounted(true);

    if (!u) {
      router.replace("/login");
      return;
    }
    const controller = new AbortController();
    fetchReports(controller.signal);
    return () => controller.abort();
  }, [router, fetchReports]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      await apiPost<{ message: string }>("/api/v1/reports", {
        user_id: user.id,
        zone: zoneRef.current || "unknown",
        category,
        severity,
        details,
      });
      addToast("Disruption report submitted!", "success");
      setDetails("");
      setSeverity(3);
      await fetchReports();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to submit report",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;
  if (!user) return null;

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-8">
        {/* Header */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric mb-2">
            Crowd Intelligence
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Disruption Reports</h1>
          <p className="text-sm text-gray-600 mt-1">
            Help verify disruptions in your zone. Your reports feed our consensus engine.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Submit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={onSubmit} className="premium-card p-6 space-y-5">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Report a Disruption
              </h2>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Category</label>
                <div className="grid grid-cols-1 gap-2">
                  {REPORT_CATEGORIES.map((cat) => {
                    const isSelected = category === cat.value;
                    const colors = CATEGORY_COLORS[cat.value] ?? { text: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200" };
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                          isSelected
                            ? `${colors.bg} ${colors.border} ${colors.text}`
                            : "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        <span className={isSelected ? colors.text : "text-gray-400"}>
                          {CATEGORY_ICONS[cat.value]}
                        </span>
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Severity — {severity}/5
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full accent-electric"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-0.5">
                  <span>Minor</span>
                  <span>Critical</span>
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Additional Details (optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric/30 focus:border-electric resize-none transition-all"
                  placeholder="Describe what you're seeing..."
                />
              </div>

              <button
                type="submit"
                id="report-submit"
                disabled={submitting}
                className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send size={16} />
                    Submit Report
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Recent Reports */}
          <div className="lg:col-span-3">
            <div className="premium-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Zone Reports
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {reports.length} reports
                </span>
              </div>

              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {loadingReports ? (
                  <div className="px-5 py-12 space-y-3">
                    <div className="skeleton-light h-12 w-full rounded-xl" />
                    <div className="skeleton-light h-12 w-full rounded-xl" />
                    <div className="skeleton-light h-12 w-full rounded-xl" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="px-5 py-16 text-center">
                    <AlertCircle size={28} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600">No reports in this zone yet.</p>
                    <p className="text-xs text-gray-500 mt-1">Be the first to report a disruption.</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <ReportRow key={report.id} report={report} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function ReportRow({ report }: { report: Report }) {
  const catLabel =
    REPORT_CATEGORIES.find((c) => c.value === report.category)?.label ?? report.category;
  const d = new Date(report.reported_at);
  const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  const colors = CATEGORY_COLORS[report.category] ?? { text: "text-gray-500", bg: "bg-gray-50", border: "border-gray-100" };

  const statusIcon =
    report.status === "verified" ? (
      <CheckCircle2 size={12} className="text-teal-500" />
    ) : (
      <Clock size={12} className="text-amber-500" />
    );

  return (
    <div className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
      <div className={`w-9 h-9 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.text} shrink-0 mt-0.5`}>
        {CATEGORY_ICONS[report.category] ?? <AlertCircle size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{catLabel}</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            {statusIcon}
            {report.status}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {report.details || "No details provided"}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10px] text-gray-400">Severity {report.severity}/5</span>
          {report.authenticity_score > 0 && (
            <span className="text-[10px] text-teal-600">
              Auth: {(report.authenticity_score * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="text-[10px] text-gray-400 block">{dateStr}</span>
        <span className="text-[10px] text-gray-300">{timeStr}</span>
      </div>
    </div>
  );
}
