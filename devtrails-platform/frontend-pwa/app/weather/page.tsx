"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  AlertTriangle,
  RefreshCw,
  Activity,
} from "lucide-react";
import { PageShell } from "../components/ui/PageShell";
import { useToast } from "../components/ui/ToastProvider";
import { apiGet, getUser } from "../lib/api";

type WeatherSignal = {
  id: string;
  zone: string;
  event_type: string;
  precipitation_mm: number;
  wind_speed_kmh: number;
  temperature_c: number;
  threshold_crossed: boolean;
  polled_at: string;
};

type WeatherListResponse = {
  data: WeatherSignal[];
  count: number;
};

export default function WeatherPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  const [signals, setSignals] = useState<WeatherSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTriggered, setFilterTriggered] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  const filterRef = React.useRef(filterTriggered);
  filterRef.current = filterTriggered;
  const hasLoadedRef = React.useRef(false);
  const addToastRef = React.useRef(addToast);
  addToastRef.current = addToast;

  const fetchSignals = useCallback(
    async (signal?: AbortSignal) => {
      try {
        let path = "/api/v1/weather?limit=50";
        if (filterRef.current === "true") path += "&triggered=true";
        else if (filterRef.current === "false") path += "&triggered=false";
        const res = await apiGet<WeatherListResponse>(path, signal);
        setSignals(res.data ?? []);

        const triggers = (res.data ?? []).filter((s) => s.threshold_crossed);
        if (triggers.length > 0 && hasLoadedRef.current) {
          addToastRef.current(
            `⚠️ ${triggers.length} threshold crossing${triggers.length > 1 ? "s" : ""} detected!`,
            "warning",
          );
        }
        hasLoadedRef.current = true;
      } catch {
        // silent
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    const u = getUser();
    setUser(u);
    setMounted(true);

    if (!u) {
      router.replace("/login");
      return;
    }
    const controller = new AbortController();
    fetchSignals(controller.signal);
    return () => controller.abort();
  }, [router, fetchSignals]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    fetchSignals();
  }, [filterTriggered, fetchSignals]);

  useEffect(() => {
    const interval = setInterval(() => fetchSignals(), 60_000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSignals();
    addToast("Refreshing weather signals...", "info", 2000);
  };

  if (!mounted) return null;
  if (!user) return null;

  const triggeredCount = signals.filter((s) => s.threshold_crossed).length;
  const avgPrecipitation =
    signals.length > 0
      ? signals.reduce((s, x) => s + x.precipitation_mm, 0) / signals.length
      : 0;

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-5 py-8 pb-24 md:pb-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-electric mb-2">
              Parametric Oracles
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Weather Signals</h1>
            <p className="text-sm text-gray-600 mt-1">
              Live readings from our oracle poller. Auto-refreshes every 60s.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Readings"
            value={signals.length.toString()}
            icon={<Activity size={18} />}
            color="text-electric"
            bg="bg-electric/8"
          />
          <SummaryCard
            label="Triggers Detected"
            value={triggeredCount.toString()}
            icon={<AlertTriangle size={18} />}
            color={triggeredCount > 0 ? "text-red-600" : "text-teal-600"}
            bg={triggeredCount > 0 ? "bg-red-50" : "bg-teal-50"}
          />
          <SummaryCard
            label="Avg Precipitation"
            value={`${avgPrecipitation.toFixed(1)}mm`}
            icon={<Droplets size={18} />}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <SummaryCard
            label="Status"
            value={triggeredCount > 0 ? "ALERT" : "NORMAL"}
            icon={<CloudRain size={18} />}
            color={triggeredCount > 0 ? "text-amber-600" : "text-teal-600"}
            bg={triggeredCount > 0 ? "bg-amber-50" : "bg-teal-50"}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "All", value: "" },
            { label: "Triggered Only", value: "true" },
            { label: "Normal Only", value: "false" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilterTriggered(opt.value)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border ${
                filterTriggered === opt.value
                  ? "bg-electric/8 text-electric border-electric/20"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Signals Table */}
        <div className="premium-card overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-600">
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Zone</div>
            <div className="col-span-2">Event</div>
            <div className="col-span-2">Precipitation</div>
            <div className="col-span-2">Wind</div>
            <div className="col-span-1">Temp</div>
            <div className="col-span-2">Time</div>
          </div>

          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="px-6 py-8 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton-light h-10 w-full rounded-xl" />
                ))}
              </div>
            ) : signals.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <CloudRain size={28} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">No weather signals yet.</p>
                <p className="text-xs text-gray-500 mt-1">
                  The oracle poller runs every 10 minutes.
                </p>
              </div>
            ) : (
              signals.map((signal) => (
                <SignalRow key={signal.id} signal={signal} />
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  return (
    <div className="premium-card p-5">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-xl font-bold tracking-tight text-gray-900 count-up">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function SignalRow({ signal }: { signal: WeatherSignal }) {
  const d = signal.polled_at ? new Date(signal.polled_at) : new Date();
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

  const precColor =
    signal.precipitation_mm > 15
      ? "text-red-600"
      : signal.precipitation_mm > 5
        ? "text-amber-600"
        : "text-teal-600";

  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors ${
        signal.threshold_crossed ? "bg-red-50/50" : ""
      }`}
    >
      {/* Status */}
      <div className="md:col-span-1 flex items-center">
        {signal.threshold_crossed ? (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="hidden md:inline">ALERT</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-600">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span className="hidden md:inline">OK</span>
          </span>
        )}
      </div>

      {/* Zone */}
      <div className="md:col-span-2 text-xs text-gray-600 truncate font-medium">
        {signal.zone}
      </div>

      {/* Event */}
      <div className="md:col-span-2">
        <span className="text-xs font-medium text-gray-600">{signal.event_type || "—"}</span>
      </div>

      {/* Precipitation */}
      <div className="md:col-span-2 flex items-center gap-1.5">
        <Droplets size={12} className={precColor} />
        <span className={`text-sm font-semibold ${precColor}`}>
          {signal.precipitation_mm.toFixed(1)}mm
        </span>
      </div>

      {/* Wind */}
      <div className="md:col-span-2 flex items-center gap-1.5 text-gray-500">
        <Wind size={12} />
        <span className="text-xs font-medium text-gray-700">{signal.wind_speed_kmh.toFixed(1)} km/h</span>
      </div>

      {/* Temp */}
      <div className="md:col-span-1 flex items-center gap-1.5 text-gray-500">
        <Thermometer size={12} />
        <span className="text-xs font-medium text-gray-700">{signal.temperature_c?.toFixed(0) ?? "—"}°</span>
      </div>

      {/* Time */}
      <div className="md:col-span-2 text-right">
        <span className="text-[10px] text-gray-400 block">{date}</span>
        <span className="text-[10px] text-gray-300">{time}</span>
      </div>
    </div>
  );
}
