"use client";

import React, { useState } from "react";

import type { ClaimListItem } from "../../lib/types";

type PredictiveAlertBannerProps = {
  claims: ClaimListItem[];
  loading: boolean;
  error: string | null;
};

function bannerMessage(
  claims: ClaimListItem[],
  loading: boolean,
  error: string | null,
): string {
  if (loading) {
    return "Live claims are syncing. Coverage remains active.";
  }

  if (error) {
    return "Unable to load live claim alerts right now. Coverage remains active.";
  }

  if (claims.length === 0) {
    return "No live claims recorded yet. Coverage remains active.";
  }

  const latest = claims[0];
  const decision = latest.decision || "UNDER_REVIEW";
  const eventID = latest.event_id || "unknown_event";
  return `Latest claim ${decision} for ${eventID}. Coverage remains active.`;
}

export function PredictiveAlertBanner({
  claims,
  loading,
  error,
}: PredictiveAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="rounded-xl border border-electric/20 bg-electric/5 p-4 flex items-start gap-3">
      <div className="mt-0.5 flex h-2.5 w-2.5">
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-electric animate-pulse" />
      </div>
      <p className="text-sm text-gray-700 leading-snug flex-1">
        {bannerMessage(claims, loading, error)}
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-sm text-gray-500 hover:text-gray-800"
        aria-label="Dismiss alert"
      >
        Close
      </button>
    </div>
  );
}
