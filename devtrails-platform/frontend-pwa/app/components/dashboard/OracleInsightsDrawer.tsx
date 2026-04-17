import React from 'react';
import { Network, Database, MapPin, SearchCheck, CheckCircle2, Navigation, Map } from 'lucide-react';

interface OracleInsightsDrawerProps {
  alert: { type: string; linkedClaim?: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OracleInsightsDrawer = ({ alert, isOpen, onClose }: OracleInsightsDrawerProps) => {
  if (!isOpen || !alert) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-gray-900 border-l border-white/10 z-50 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">

        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gray-950/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
               <Network className="w-5 h-5" />
             </div>
             <h3 className="font-semibold text-lg text-white">Trigger to Claim Linkage</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <span className="w-5 h-5 text-xl leading-none">&times;</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          <div className="border border-indigo-500/30 bg-indigo-500/10 rounded-xl p-4 flex gap-4 items-start">
            <div className="h-6 w-6 mt-1 flex-shrink-0 flex items-center justify-center bg-indigo-500 rounded-full">
               <SearchCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
               <h3 className="font-bold text-gray-100">{alert.type}</h3>
               <p className="text-xs text-indigo-300 mt-1 leading-relaxed">
                 Signal origin was geo-fenced against Active Policy coordinates. Condition met for partial payout.
               </p>
            </div>
          </div>

          <div className="glass-card rounded-xl border border-white/5 bg-gray-950/30 p-4 space-y-4">
             <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Geo Validation Overlay</h4>

             <div className="space-y-3">
               <div className="flex items-center justify-between border-b border-white/5 pb-2">
                 <div className="flex items-center gap-2">
                   <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                   <span className="text-sm font-medium text-gray-300">Driver Node</span>
                 </div>
                 <span className="text-sm font-mono text-gray-400">28.61, 77.20</span>
               </div>

               <div className="flex items-center justify-between border-b border-white/5 pb-2">
                 <div className="flex items-center gap-2">
                   <Map className="w-3.5 h-3.5 text-red-400" />
                   <span className="text-sm font-medium text-gray-300">Hazard Epicenter</span>
                 </div>
                 <span className="text-sm font-mono text-gray-400">28.62, 77.21 (1.4mi delta)</span>
               </div>

               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                   <span className="text-sm font-medium text-gray-300">Route Collision</span>
                 </div>
                 <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                   <CheckCircle2 className="w-3 h-3" /> Confirmed
                 </span>
               </div>
             </div>
          </div>

          <div className="glass-card rounded-xl border border-white/5 bg-gray-950/30 p-4">
             <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
               <Database className="w-3.5 h-3.5" /> Evidence Sources
             </h4>
             <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 ml-2">
         <li><span className="text-gray-200">OSRM / OpenRouteService</span>: Route congestion trace</li>
         <li><span className="text-gray-200">Open-Meteo Poller</span>: Zone rainfall and wind evidence</li>
             </ul>
             <div className="mt-4 p-2.5 bg-black/50 border border-white/5 rounded-lg overflow-x-auto">
               <pre className="text-xs text-gray-500 font-mono">
                 {JSON.stringify({
                   "trigger": "T-3M-XR",
                   "severity": "5-High",
                   "timestamp": new Date().toISOString()
                 }, null, 2)}
               </pre>
             </div>
          </div>

        </div>

        <div className="p-5 border-t border-white/10 bg-gray-950/50">
          {alert.linkedClaim ? (
             <button
               className="w-full py-3 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-semibold shadow-lg shadow-emerald-900/10 cursor-default"
             >
               Claim Link Established: {alert.linkedClaim}
             </button>
          ) : (
            <button
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex justify-center items-center gap-2"
              onClick={onClose}
            >
              Assess for Payout
            </button>
          )}
        </div>
      </div>
    </>
  );
};
