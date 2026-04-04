import React from 'react';
import { TriggerEvent } from './types';
import { CloudLightning, MessageSquareWarning, Navigation, Map, MapPin, AlertCircle } from 'lucide-react';

interface LiveFeedProps {
  events: TriggerEvent[];
  onSelectEvent: (event: TriggerEvent) => void;
}

export const LiveEventFeedTable = ({ events, onSelectEvent }: LiveFeedProps) => {
  const getIcon = (source: string) => {
    switch (source) {
      case 'Weather': return <CloudLightning className="w-4 h-4 text-blue-400" />;
      case 'Social': return <MessageSquareWarning className="w-4 h-4 text-pink-400" />;
      case 'Traffic': return <Navigation className="w-4 h-4 text-amber-400" />;
      case 'Routing': return <Map className="w-4 h-4 text-purple-400" />;
      case 'Places': return <MapPin className="w-4 h-4 text-emerald-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'Critical': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'High': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Low': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="overflow-x-auto w-full glass-card rounded-2xl border border-white/10 bg-white/4">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider font-semibold">
          <tr>
            <th className="px-6 py-4">Time</th>
            <th className="px-6 py-4">Source</th>
            <th className="px-6 py-4">Event Protocol</th>
            <th className="px-6 py-4">Location</th>
            <th className="px-6 py-4">Severity</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {events.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                No telemetry data found for the current filters.
              </td>
            </tr>
          ) : (
            events.map((evt) => (
              <tr
                key={evt.id}
                onClick={() => onSelectEvent(evt)}
                className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 font-mono text-gray-400 text-xs">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour12: false })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/5 rounded-md border border-white/10 group-hover:scale-110 transition-transform">
                      {getIcon(evt.source)}
                    </div>
                    <span className="text-gray-300 font-medium">{evt.source}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-200">
                  {evt.title}
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {evt.location}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border tracking-wide ${getSeverityColor(evt.severity)}`}>
                    {evt.severity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${
                    evt.status === 'Processed' ? 'text-indigo-400' : evt.status === 'Ignored' ? 'text-gray-500' : 'text-amber-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      evt.status === 'Processed' ? 'bg-indigo-400' : evt.status === 'Ignored' ? 'bg-gray-500' : 'bg-amber-400 animate-pulse'
                    }`} />
                    {evt.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
