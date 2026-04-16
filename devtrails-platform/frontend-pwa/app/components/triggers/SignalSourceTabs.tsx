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
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-gray-200 mb-4">
      {tabs.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          onClick={() => onSourceChange(type)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all whitespace-nowrap font-semibold text-sm border-b-2 -mb-px ${
            activeSource === type
              ? 'text-electric border-electric bg-electric/5'
              : 'text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Icon className={`w-4 h-4 ${activeSource === type ? 'text-electric' : 'text-gray-400'}`} />
          {label}
        </button>
      ))}
    </div>
  );
};
