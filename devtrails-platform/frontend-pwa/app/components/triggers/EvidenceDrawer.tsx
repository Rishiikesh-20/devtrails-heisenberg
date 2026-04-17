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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[460px] bg-white border-l border-gray-200 z-50 shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-electric/10 rounded-xl flex items-center justify-center">
              <Network className="w-4 h-4 text-electric" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Signal Evidence</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Event title */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-electric">{event.source} Node</span>
              <span className="text-xs text-gray-400 font-medium">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900">{event.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{event.location}</p>
          </div>

          {/* Confidence + Provider */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Confidence</p>
              <p className="text-2xl font-extrabold text-gray-900">
                {(event.evidence.confidenceScore * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Provider</p>
              <p className="text-sm font-bold text-gray-900 pt-1">{event.evidence.provider}</p>
            </div>
          </div>

          {/* Raw Telemetry */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-500" />
              Raw Telemetry Payload
            </h4>
            <div className="bg-gray-950 border border-gray-200 rounded-xl p-4 overflow-x-auto">
              <pre className="text-xs text-teal-400 font-mono leading-relaxed">
                {JSON.stringify(JSON.parse(event.evidence.rawPayload), null, 2)}
              </pre>
            </div>
          </div>

          {/* Enriched Metadata */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Enriched Metadata
            </h4>
            <div className="space-y-0 rounded-xl border border-gray-100 overflow-hidden bg-white">
              {Object.entries(event.evidence.metadata).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center text-sm px-4 py-3 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600 font-medium capitalize">{key.replace('_', ' ')}</span>
                  <span className="font-mono font-bold text-gray-900">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            className="w-full py-3 bg-electric hover:bg-electric-600 text-white rounded-xl font-bold transition-colors active:scale-[0.98]"
            onClick={onClose}
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </>
  );
};
