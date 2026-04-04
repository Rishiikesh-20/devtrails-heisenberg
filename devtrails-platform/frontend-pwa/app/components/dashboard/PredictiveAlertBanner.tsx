"use client";

import React, { useState } from "react";

export function PredictiveAlertBanner() {
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
        Predictive alert: 68% chance of severe waterlogging in your zone
        tomorrow. Coverage remains active.
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
