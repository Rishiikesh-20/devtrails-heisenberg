import React from 'react';
import { TriggerEvent } from './types';
import { X, Network, Database, ShieldAlert } from 'lucide-react';

interface EvidenceDrawerProps {
  event: TriggerEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EvidenceDrawer = ({ event, isOpen, onClose }: EvidenceDrawerProps) => {
  if (!isOpen || !event) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-gray-900 border-l border-white/10 z-50 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">

        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gray-950/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
               <Network className="w-5 h-5" />
             </div>
             <h3 className="font-semibold text-lg text-white">Signal Evidence</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">{event.source} Node</span>
              <span className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-gray-100">{event.title}</h2>
            <p className="text-sm text-gray-400 mt-1">{event.location}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 border border-white/10 rounded-xl p-4">
               <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Confidence</p>
               <p className="text-2xl font-bold text-white">{(event.evidence.confidenceScore * 100).toFixed(1)}%</p>
             </div>
             <div className="bg-white/5 border border-white/10 rounded-xl p-4">
               <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Provider</p>
               <p className="text-sm font-bold text-white pt-1">{event.evidence.provider}</p>
             </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-gray-300">
              <Database className="w-4 h-4 text-emerald-400" />
              Raw Telemetry Payload
            </h4>
            <div className="bg-black/50 border border-white/5 rounded-xl p-4 overflow-x-auto">
              <pre className="text-xs text-emerald-300/80 font-mono">
                {JSON.stringify(JSON.parse(event.evidence.rawPayload), null, 2)}
              </pre>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-gray-300">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Enriched Metadata
            </h4>
            <div className="space-y-2">
              {Object.entries(event.evidence.metadata).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                  <span className="text-gray-500 capitalize">{key.replace('_', ' ')}</span>
                  <span className="font-mono text-gray-200">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="p-5 border-t border-white/10 bg-gray-950/50">
          <button
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
            onClick={onClose}
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </>
  );
};
