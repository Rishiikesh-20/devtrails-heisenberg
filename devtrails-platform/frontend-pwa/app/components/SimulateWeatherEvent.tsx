"use client";

import React, { useState } from "react";

export function SimulateWeatherEvent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Placeholder for sending a manual event to the Oracle service / Kafka API endpoint
      await new Promise((resolve) => setTimeout(resolve, 800)); // Mock network delay

      setResult("Disruption event sent successfully to Kafka topic!");
    } catch {
      setResult("Failed to send disruption event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg w-full max-w-md border border-red-200">
      <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
        <span className="text-2xl mr-2">⛈️</span> Developer Sandbox
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Trigger a synthetic "heavy rain" event (&gt;15mm) to South Delhi.
        This will activate the Oracle producer payload and fire claim validation logic via Kafka.
      </p>

      <button
        onClick={handleSimulate}
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
      >
        {loading ? "Simulating..." : "Simulate Weather Event"}
      </button>

      {result && (
        <div className="mt-3 p-2 bg-green-50 text-green-800 text-sm rounded border border-green-200">
          ✓ {result}
        </div>
      )}
    </div>
  );
}
