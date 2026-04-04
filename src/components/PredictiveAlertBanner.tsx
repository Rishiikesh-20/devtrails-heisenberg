"use client";

import React, { useMemo, useState } from "react";
import { X } from "lucide-react";

import type { ClaimListItem, WeatherSignal } from "@/lib/devtrailsApi";

type PredictiveAlertBannerProps = {
  latestClaim: ClaimListItem | null;
  latestSignal: WeatherSignal | null;
  loading?: boolean;
  error?: string | null;
};

function shortEventID(eventID: string): string {
  return eventID.length > 8 ? `${eventID.slice(0, 8)}...` : eventID;
}

function normalizeLabel(raw: string): string {
  return raw
    .split("_")
    .filter(Boolean)
    .map((chunk) => chunk[0].toUpperCase() + chunk.slice(1))
    .join(" ");
}

export default function PredictiveAlertBanner({
  latestClaim,
  latestSignal,
  loading = false,
  error = null,
}: PredictiveAlertBannerProps) {
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);

  const message = useMemo(() => {
    if (error) {
      return "Live risk feed temporarily unavailable. Retrying in the background.";
    }

    if (loading && !latestClaim && !latestSignal) {
      return "Loading live risk telemetry and claim decisions...";
    }

    if (latestClaim) {
      return `Latest claim ${latestClaim.decision} for event ${shortEventID(latestClaim.event_id)}. Current status: ${latestClaim.status}.`;
    }

    if (latestSignal) {
      if (latestSignal.threshold_crossed) {
        return `Live alert: ${normalizeLabel(latestSignal.event_type)} detected in your zone. Severity ${latestSignal.severity_factor.toFixed(2)}.`;
      }

      return `No active disruptions in your zone. Last signal: ${normalizeLabel(latestSignal.event_type)}.`;
    }

    return "No live claims yet. Trigger an event to validate full backend wiring.";
  }, [error, latestClaim, latestSignal, loading]);

  if (dismissedMessage === message) return null;

  return (
    <div className="relative w-full border border-white/20 bg-white/4 backdrop-blur-md rounded-xl px-5 py-3.5 flex items-center gap-3 transition-all duration-300">
      {/* Pulsing indicator dot */}
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
      </span>

      <p className="text-sm text-zinc-300 leading-snug flex-1">
        {message}
      </p>

      <button
        onClick={() => setDismissedMessage(message)}
        className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors shrink-0"
        aria-label="Dismiss alert"
      >
        <X size={16} />
      </button>
    </div>
  );
}
