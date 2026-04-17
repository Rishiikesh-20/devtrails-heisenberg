"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Landmark,
  History,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  CircleX,
  Headset,
} from "lucide-react";
import { PageShell } from "../components/ui/PageShell";
import { apiGet, getUser } from "../lib/api";
import { formatDateTimeIn, formatInr, payoutStatusLabel } from "../lib/formatting";
import type {
  PayoutListV1Item,
  PayoutListV1Response,
  PayoutSupportResponse,
  RegisterResponse,
} from "../lib/types";

type PayoutStatusFilter = "all" | "pending" | "processing" | "credited" | "failed";

export default function PayoutsPage() {
  const router = useRouter();
  const [user, setUser] = useState<RegisterResponse | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);

  const [statusFilter, setStatusFilter] = useState<PayoutStatusFilter>("all");
  const [items, setItems] = useState<PayoutListV1Item[]>([]);
  const [support, setSupport] = useState<PayoutSupportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setUser(getUser());
      setSessionResolved(true);
    });
  }, []);

  const loadPayouts = useCallback(async (sessionUser: RegisterResponse, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    const statusParam = statusFilter === "all" ? "" : `&status=${encodeURIComponent(statusFilter)}`;

    const [payoutsResult, supportResult] = await Promise.allSettled([
      apiGet<PayoutListV1Response>(`/api/v1/payouts?user_id=${encodeURIComponent(sessionUser.id)}&limit=30${statusParam}`, signal),
      apiGet<PayoutSupportResponse>(`/api/v1/payouts/support?user_id=${encodeURIComponent(sessionUser.id)}`, signal),
    ]);

    if (payoutsResult.status === "fulfilled") {
      setItems(payoutsResult.value.items ?? []);
    }

    if (supportResult.status === "fulfilled") {
      setSupport(supportResult.value);
    } else {
      setSupport(null);
    }

    if (payoutsResult.status === "rejected") {
      setError("Failed to load payouts. Retry to refresh.");
    }

    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    if (!sessionResolved) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void loadPayouts(user, controller.signal);
      }
    });
    return () => controller.abort();
  }, [loadPayouts, router, sessionResolved, user]);

  const latestPayout = items[0] ?? null;
  const historicalPayouts = items.slice(1);

  const completedPayouts = items.filter((item) => ["credited", "succeeded"].includes(item.status));
  const failedPayouts = items.filter((item) => item.status === "failed");

  const averageProcessingSeconds = useMemo(() => {
    const durations = completedPayouts
      .filter((item) => item.processed_at)
      .map((item) => {
        const created = new Date(item.created_at).getTime();
        const processed = new Date(item.processed_at || item.created_at).getTime();
        return Math.max(0, Math.round((processed - created) / 1000));
      });

    if (durations.length === 0) {
      return 0;
    }

    return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
  }, [completedPayouts]);

  const successRate = items.length === 0
    ? 0
    : Math.round(((items.length - failedPayouts.length) / items.length) * 1000) / 10;

  const railHealthLabel = failedPayouts.length > 0 ? "Needs Attention" : "Operational";

  if (!sessionResolved) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric">Parametric Payouts</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-electric/8 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-electric" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payout Center</h1>
                <p className="text-sm text-gray-600">Track your disbursements and payout support state.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadPayouts(user)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={12} /> Refresh
            </button>
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-electric hover:bg-electric/5 transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard label="Avg Processing" value={averageProcessingSeconds > 0 ? `${averageProcessingSeconds}s` : "-"} />
          <MetricCard label="Success Rate" value={items.length > 0 ? `${successRate}%` : "-"} />
          <MetricCard label="Rail Health" value={railHealthLabel} />
        </section>

        {support && (
          <section className="rounded-xl border border-electric/20 bg-electric/5 p-4 flex items-start gap-3">
            <Headset size={16} className="text-electric mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold">Support Status: {support.status_label}</p>
              <p className="text-xs text-gray-600 mt-1">Next action: {support.next_action.replaceAll("_", " ")}.</p>
              <p className="text-xs text-gray-500 mt-1">{support.support_hint}</p>
            </div>
          </section>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void loadPayouts(user)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <section className="flex flex-wrap gap-2">
          {(["all", "pending", "processing", "credited", "failed"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === value
                  ? "bg-electric/8 border-electric/20 text-electric"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {value}
            </button>
          ))}
        </section>

        <section className="space-y-5">
          <h2 className="text-lg font-bold text-gray-800">Latest Payout</h2>
          {loading ? (
            <div className="premium-card p-6 animate-pulse space-y-3">
              <div className="h-5 bg-gray-100 rounded w-48" />
              <div className="h-4 bg-gray-100 rounded w-72" />
              <div className="h-4 bg-gray-100 rounded w-56" />
            </div>
          ) : latestPayout ? (
            <PayoutCard payout={latestPayout} emphasize />
          ) : (
            <div className="premium-card p-8 text-center">
              <AlertCircle size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No payouts found for this filter.</p>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" /> Historical Transfers
            </h2>
            <span className="text-sm font-medium text-gray-500 px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
              {historicalPayouts.length} records
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {historicalPayouts.map((payout) => (
              <PayoutCard key={payout.payout_id} payout={payout} />
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-card p-5">
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}

function PayoutCard({ payout, emphasize = false }: { payout: PayoutListV1Item; emphasize?: boolean }) {
  const status = payout.status.toLowerCase();

  const statusIcon = status === "credited" || status === "succeeded"
    ? <CheckCircle2 size={14} className="text-teal-500" />
    : status === "failed"
      ? <CircleX size={14} className="text-red-500" />
      : <Clock size={14} className="text-amber-500" />;

  return (
    <div className={`premium-card p-5 space-y-3 ${emphasize ? "ring-2 ring-electric/20 border-electric/30" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Payout ID</p>
          <p className="text-sm font-mono font-semibold text-gray-900">{payout.payout_id}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold text-gray-900">{formatInr(payout.amount)}</p>
          <p className="text-[10px] text-gray-400">{payout.currency.toUpperCase()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1 text-gray-600">
          {statusIcon}
          {payoutStatusLabel(payout.status)}
        </span>
        <span className="text-gray-500">ETA: {payout.eta_minutes >= 0 ? `${payout.eta_minutes}m` : "manual"}</span>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>Claim: {payout.claim_id}</p>
        <p>Decision: {payout.decision_label}</p>
        <p>Created: {formatDateTimeIn(payout.created_at)}</p>
        {payout.processed_at && <p>Processed: {formatDateTimeIn(payout.processed_at)}</p>}
        {payout.failure_reason && <p className="text-red-600">Reason: {payout.failure_reason}</p>}
      </div>

      <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500">
        Next action: {payout.next_action.replaceAll("_", " ")}
      </div>
    </div>
  );
}
