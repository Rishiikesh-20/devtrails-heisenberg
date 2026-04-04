import React, { useState } from 'react';
import { Package, ShoppingBag, Truck, Clock, ShieldAlert } from 'lucide-react';

export const RiskSelectors = () => {
  const [segment, setSegment] = useState('food');
  const [shift, setShift] = useState('day');

  return (
    <div className="space-y-6">
      <div className="glass-card p-5 rounded-2xl border border-white/10 bg-white/4">
        <h3 className="text-sm font-bold text-white mb-4">Select Delivery Segment</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'food', label: 'Food & Meals', icon: Package },
            { id: 'grocery', label: 'Grocery', icon: ShoppingBag },
            { id: 'courier', label: 'Packages', icon: Truck },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setSegment(s.id)}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                segment === s.id ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <s.icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 rounded-2xl border border-white/10 bg-white/4">
        <h3 className="text-sm font-bold text-white mb-4">Typical Shift Pattern</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'day', label: 'Day Shift (8AM-8PM)' },
            { id: 'night', label: 'Night Shift (8PM-8AM)' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setShift(s.id)}
              className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                shift === s.id ? 'border-amber-500 bg-amber-500/20 text-amber-300' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-start gap-4">
        <div className="mt-1"><ShieldAlert className="w-5 h-5 text-indigo-400" /></div>
        <div>
          <h4 className="text-sm font-bold text-white">Zone Risk Preview</h4>
          <p className="text-xs text-indigo-200 mt-1">
            Based on {segment} delivery during {shift === 'day' ? 'daytime' : 'nighttime'}, base premium adjusted by
            <strong className="text-emerald-400 ml-1">{shift === 'night' ? '+2.5%' : '-1.2%'}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
