import React from 'react';
import { TriggerEvent } from './types';
import { CloudLightning, MessageSquareWarning, Navigation, Map, MapPin, AlertCircle } from 'lucide-react';

interface LiveFeedProps {
  events: TriggerEvent[];
  onSelectEvent: (event: TriggerEvent) => void;
}

const getIcon = (source: string) => {
  switch (source) {
    case 'Weather': return <CloudLightning className="w-4 h-4 text-blue-500" />;
    case 'Social': return <MessageSquareWarning className="w-4 h-4 text-pink-500" />;
    case 'Traffic': return <Navigation className="w-4 h-4 text-amber-500" />;
    case 'Routing': return <Map className="w-4 h-4 text-violet-500" />;
    case 'Places': return <MapPin className="w-4 h-4 text-emerald-500" />;
    default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
  }
};

const getSeverityStyle = (sev: string) => {
  switch (sev) {
    case 'Critical': return 'text-red-700 bg-red-50 border-red-200';
    case 'High': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'Medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'Low': return 'text-teal-700 bg-teal-50 border-teal-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const LiveEventFeedTable = ({ events, onSelectEvent }: LiveFeedProps) => {
  return (
    <div className="premium-card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600">
          <tr>
            <th className="px-5 py-3.5">Time</th>
            <th className="px-5 py-3.5">Source</th>
            <th className="px-5 py-3.5">Event Protocol</th>
            <th className="px-5 py-3.5 hidden md:table-cell">Location</th>
            <th className="px-5 py-3.5">Severity</th>
            <th className="px-5 py-3.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {events.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">
                No telemetry data found for the current filters.
              </td>
            </tr>
          ) : (
            events.map((evt) => (
              <tr
                key={evt.id}
                onClick={() => onSelectEvent(evt)}
                className="hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <td className="px-5 py-4 font-mono text-gray-500 text-xs whitespace-nowrap">
                  {new Date(evt.timestamp).toLocaleTimeString([], { hour12: false })}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {getIcon(evt.source)}
                    </div>
                    <span className="text-gray-800 font-semibold text-xs">{evt.source}</span>
                  </div>
                </td>
                <td className="px-5 py-4 font-medium text-gray-900 text-sm">
                  {evt.title}
                </td>
                <td className="px-5 py-4 text-gray-600 text-sm hidden md:table-cell">
                  {evt.location}
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border tracking-wide ${getSeverityStyle(evt.severity)}`}>
                    {evt.severity}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${
                    evt.status === 'Processed' ? 'text-electric' : evt.status === 'Ignored' ? 'text-gray-400' : 'text-amber-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      evt.status === 'Processed' ? 'bg-electric' : evt.status === 'Ignored' ? 'bg-gray-300' : 'bg-amber-500 animate-pulse'
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
