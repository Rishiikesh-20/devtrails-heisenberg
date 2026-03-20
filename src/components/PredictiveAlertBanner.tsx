"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

export default function PredictiveAlertBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative w-full border border-white/20 bg-white/[0.04] backdrop-blur-md rounded-xl px-5 py-3.5 flex items-center gap-3 transition-all duration-300">
      {/* Pulsing indicator dot */}
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
      </span>

      <p className="text-sm text-zinc-300 leading-snug flex-1">
        <span className="mr-1.5">⚠️</span>
        68% chance of severe waterlogging in Andheri West tomorrow.
      </p>

      <button
        onClick={() => setDismissed(true)}
        className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors shrink-0"
        aria-label="Dismiss alert"
      >
        <X size={16} />
      </button>
    </div>
  );
}
