import React from 'react';
import { SignalSource } from './types';
import { CloudLightning, MessageSquareWarning, Navigation, Map, MapPin, Radio } from 'lucide-react';

interface SignalSourceTabsProps {
  activeSource: SignalSource;
  onSourceChange: (source: SignalSource) => void;
}

export const SignalSourceTabs = ({ activeSource, onSourceChange }: SignalSourceTabsProps) => {
  const tabs: { type: SignalSource; label: string; icon: React.ElementType }[] = [
    { type: 'All', label: 'All Signals', icon: Radio },
    { type: 'Weather', label: 'Weather Orbit', icon: CloudLightning },
    { type: 'Social', label: 'GDELT Social', icon: MessageSquareWarning },
    { type: 'Traffic', label: 'Traffic Grid', icon: Navigation },
    { type: 'Routing', label: 'Routing Plex', icon: Map },
    { type: 'Places', label: 'Places Matrix', icon: MapPin },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/10 mb-6">
      {tabs.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          onClick={() => onSourceChange(type)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all whitespace-nowrap font-medium text-sm
            ${activeSource === type
              ? 'bg-white/10 text-white border-b-2 border-indigo-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border-b-2 border-transparent'
            }`}
        >
          <Icon className={`w-4 h-4 ${activeSource === type ? 'text-indigo-400' : 'text-gray-500'}`} />
          {label}
        </button>
      ))}
    </div>
  );
};
