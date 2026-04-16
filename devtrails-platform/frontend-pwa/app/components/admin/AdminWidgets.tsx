'use client';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert, TrendingUp, Users, Activity, FileText, Shield } from 'lucide-react';

export const MetricsCards = () => {
  const metrics = [
    { id: 1, label: 'Total Active Policies', value: '42,109', change: '+12%', icon: Users, color: 'text-electric', bg: 'bg-electric/8', positive: false },
    { id: 2, label: 'Claims Processed (YTD)', value: '8,401', change: '+5%', icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50', positive: false },
    { id: 3, label: 'Current Loss Ratio', value: '41.2%', change: '-2.1%', icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50', positive: true },
    { id: 4, label: 'Platform Uptime', value: '99.99%', change: 'Steady', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50', positive: true },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map(m => {
        const Icon = m.icon;
        return (
          <div key={m.id} className="premium-card p-5">
            <div className="flex justify-between items-start mb-3">
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                m.positive ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}>
                {m.change}
              </span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-2">{m.value}</p>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mt-1">{m.label}</p>
          </div>
        );
      })}
    </div>
  );
};

export const ClaimHeatmap = () => {
  return (
    <div className="premium-card p-6 h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      <Activity className="w-12 h-12 text-electric/30 mb-3" />
      <h3 className="text-gray-800 font-bold text-base mb-1 relative z-10">Regional Claim Heatmap</h3>
      <p className="text-sm text-gray-500 relative z-10 text-center max-w-xs">
        Visualized concentration of parametric payouts across active delivery zones.
      </p>
      <div className="absolute bottom-4 right-4 flex gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[10px] font-semibold text-gray-600">High (12k+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[10px] font-semibold text-gray-600">Med (8k+)</span>
        </div>
      </div>
    </div>
  );
};

export const FraudTrendChart = () => {
  const data = [
    { name: 'Jan', fraud: 120, legitimate: 1400 },
    { name: 'Feb', fraud: 98, legitimate: 1800 },
    { name: 'Mar', fraud: 80, legitimate: 2100 },
    { name: 'Apr', fraud: 154, legitimate: 1500 },
    { name: 'May', fraud: 100, legitimate: 2300 },
    { name: 'Jun', fraud: 85, legitimate: 2600 },
  ];

  return (
    <div className="premium-card p-6 h-[300px]">
      <h3 className="text-sm font-bold tracking-wider text-gray-700 uppercase mb-4 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-red-500" /> Fraud Attempt Trends
      </h3>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            labelStyle={{ color: '#374151', fontWeight: 600 }}
          />
          <Area type="monotone" dataKey="fraud" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorFraud)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RiskForecastPanel = () => {
  const risks = [
    { label: 'Severe Rain (Delhi)', prob: '84%', impact: 'High', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200' },
    { label: 'Unrest (Zone 4)', prob: '42%', impact: 'Med', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Traffic Spike (Fest)', prob: '95%', impact: 'Low', dot: 'bg-teal-500', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  ];

  return (
    <div className="premium-card p-6">
      <h3 className="text-sm font-bold tracking-wider text-gray-700 uppercase mb-5 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-amber-500" /> 7-Day Risk Forecast
      </h3>
      <div className="space-y-4">
        {risks.map((risk, i) => (
          <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <div>
              <p className="text-sm font-semibold text-gray-900">{risk.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">Probability: {risk.prob}</p>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${risk.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
              {risk.impact} Impact
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ReinsuranceStatusWidget = () => {
  return (
    <div className="premium-card p-6">
      <div>
        <h3 className="text-sm font-bold tracking-wider text-gray-700 uppercase mb-1 flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-600" /> Reinsurance Controls
        </h3>
        <p className="text-[11px] text-gray-500 mb-5 leading-relaxed">
          Aggregate Stop-Loss Trigger: 90% of Premium Pool. Shifts excess liability to reinsurance partner.
        </p>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-gray-700">Weekly Premium Pool</span>
              <span className="text-gray-900 font-bold">₹45.2M</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-gray-700">Pool Utilization (Payouts)</span>
              <span className="text-teal-600 font-bold">41.2%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 relative">
              <div className="bg-teal-500 h-2.5 rounded-full relative z-10" style={{ width: '41.2%' }}></div>
              {/* 90% Marker */}
              <div className="absolute top-0 bottom-0 left-[90%] w-[2px] bg-red-400 z-20"></div>
            </div>
            <p className="text-[9px] text-red-500 uppercase tracking-widest text-right mt-1 font-bold">90% Stop-Loss</p>
          </div>
        </div>
      </div>
      
      <div className="mt-5 pt-4 border-t border-gray-100 space-y-2.5">
         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Catastrophic Layers (1 & 3)</p>
         <div className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
            <div className="flex-1">
              <span className="text-xs font-semibold text-gray-700 block">Disaster-Week (1.5x Cap)</span>
              <span className="text-[10px] text-gray-500">None active</span>
            </div>
         </div>
         <div className="flex items-center gap-2.5 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <div className="flex-1">
              <span className="text-xs font-semibold text-amber-800 block">Zone Anomaly Freeze</span>
              <span className="text-[10px] text-amber-600">Mumbai-A under AI review (&gt;3x vol)</span>
            </div>
         </div>
      </div>
    </div>
  );
};
