import React from 'react';
import { MapPin, Activity, Copy, ShieldCheck, Database, Zap, FileText } from 'lucide-react';

export const FraudGateBreakdown = () => {
  const gates = [
    { name: 'Location Validation', status: 'Passed', icon: MapPin, desc: 'GPS trail matches event zone. No spoofing detected.' },
    { name: 'Activity Heuristics', status: 'Passed', icon: Activity, desc: 'Velocity and motion signatures align with gig delivery profiles.' },
    { name: 'Duplicate Detection', status: 'Flagged', icon: Copy, desc: 'Similar payload observed from another device in 100m radius.' }
  ];

  return (
    <div className="glass-card p-5 rounded-2xl border border-white/10 bg-white/4 space-y-4">
      <h3 className="text-sm font-semibold tracking-wider text-gray-300 uppercase flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Fraud Engine Gates
      </h3>
      <div className="space-y-3">
        {gates.map((g, i) => (
          <div key={i} className="flex items-start gap-4 p-3 bg-black/20 rounded-xl border border-white/5">
            <div className={`p-2 rounded-lg ${g.status === 'Passed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <g.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-200">{g.name}</p>
              <p className="text-xs text-gray-500 mt-1">{g.desc}</p>
            </div>
            <div className="ml-auto">
               <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${
                 g.status === 'Passed' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-rose-500/30 text-rose-400 bg-rose-500/10'
               }`}>{g.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EvidencePanel = () => {
  return (
    <div className="glass-card p-5 rounded-2xl border border-white/10 bg-white/4">
      <h3 className="text-sm font-semibold tracking-wider text-gray-300 uppercase flex items-center gap-2 mb-4">
        <Database className="w-4 h-4 text-indigo-400" /> Attached Evidence
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 border border-white/5 rounded-xl bg-white/5 flex items-center gap-3">
           <FileText className="w-4 h-4 text-gray-400" />
           <div className="flex-1 min-w-0"><p className="text-xs text-gray-300 truncate">telemetry_trace_xyz.json</p><p className="text-[10px] text-gray-500">12kb • HMAC Verified</p></div>
        </div>
        <div className="p-3 border border-white/5 rounded-xl bg-white/5 flex items-center gap-3">
           <Zap className="w-4 h-4 text-amber-400" />
           <div className="flex-1 min-w-0"><p className="text-xs text-gray-300 truncate">Oracle Signature</p><p className="text-[10px] text-gray-500">TomTom Traffic DB</p></div>
        </div>
      </div>
    </div>
  );
};

export const ConfidenceScore = () => {
  return (
    <div className="glass-card p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-bold text-white mb-1">Decision Explainability</h3>
        <p className="text-xs text-indigo-300">Our AI consensus engine evaluated 4,021 parameters to arrive at this score. Transparency is our priority.</p>
      </div>
      <div className="shrink-0 flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/10">
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Confidence</p>
          <p className="text-2xl font-bold text-emerald-400">94.2%</p>
        </div>
      </div>
    </div>
  );
};
