import React from 'react';
import { MapPin, Activity, Copy, ShieldCheck, Database, Zap, FileText } from 'lucide-react';

export const FraudGateBreakdown = () => {
  const gates = [
    { name: 'Location Validation', status: 'Passed', icon: MapPin, desc: 'GPS trail matches event zone. No spoofing detected.' },
    { name: 'Activity Heuristics', status: 'Passed', icon: Activity, desc: 'Velocity and motion signatures align with gig delivery profiles.' },
    { name: 'Duplicate Detection', status: 'Flagged', icon: Copy, desc: 'Similar payload observed from another device in 100m radius.' },
  ];

  return (
    <div className="premium-card p-5 space-y-4">
      <h3 className="text-sm font-bold tracking-wider text-gray-700 uppercase flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-teal-500" /> Fraud Engine Gates
      </h3>
      <div className="space-y-3">
        {gates.map((g, i) => (
          <div key={i} className="flex items-start gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              g.status === 'Passed' ? 'bg-teal-50 text-teal-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <g.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{g.name}</p>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{g.desc}</p>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border shrink-0 ${
              g.status === 'Passed'
                ? 'border-teal-200 text-teal-700 bg-teal-50'
                : 'border-rose-200 text-rose-700 bg-rose-50'
            }`}>
              {g.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EvidencePanel = () => {
  return (
    <div className="premium-card p-5">
      <h3 className="text-sm font-bold tracking-wider text-gray-700 uppercase flex items-center gap-2 mb-4">
        <Database className="w-4 h-4 text-electric" /> Attached Evidence
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">telemetry_trace_xyz.json</p>
            <p className="text-[10px] text-gray-500 mt-0.5">12kb · HMAC Verified</p>
          </div>
        </div>
        <div className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">Oracle Signature</p>
				<p className="text-[10px] text-gray-500 mt-0.5">OSRM + OpenRouteService Trace</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConfidenceScore = () => {
  return (
    <div className="premium-card p-5 border-electric/20 ring-1 ring-electric/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">Decision Explainability</h3>
        <p className="text-xs text-gray-600 leading-relaxed max-w-sm">
          Our AI consensus engine evaluated 4,021 parameters to arrive at this score.
          Transparency is our priority.
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-3 bg-gray-50 border border-gray-100 px-5 py-3 rounded-xl">
        <div className="text-right">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Confidence</p>
          <p className="text-2xl font-extrabold text-teal-600">94.2%</p>
        </div>
      </div>
    </div>
  );
};
