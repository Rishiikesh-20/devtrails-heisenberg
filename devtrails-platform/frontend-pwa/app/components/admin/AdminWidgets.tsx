'use client';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert, TrendingUp, Users, Activity, FileText } from 'lucide-react';

export const MetricsCards = () => {
  const metrics = [
    { id: 1, label: 'Total Active Policies', value: '42,109', change: '+12%', icon: Users },
    { id: 2, label: 'Claims Processed (YTD)', value: '8,401', change: '+5%', icon: FileText },
    { id: 3, label: 'Current Loss Ratio', value: '41.2%', change: '-2.1%', icon: TrendingUp, positive: true },
    { id: 4, label: 'Platform Uptime', value: '99.99%', change: 'Steady', icon: Activity }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map(m => {
        const Icon = m.icon;
        return (
          <div key={m.id} className="glass-card rounded-2xl p-5 border border-white/10 bg-white/4">
            <div className="flex justify-between items-start mb-2">
              <div className="p-2 bg-indigo-500/10 rounded-lg"><Icon className="w-5 h-5 text-indigo-400" /></div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                m.positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-gray-400'
              }`}>{m.change}</span>
            </div>
            <p className="text-2xl font-bold text-white mt-4">{m.value}</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{m.label}</p>
          </div>
        );
      })}
    </div>
  );
};

export const ClaimHeatmap = () => {
  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10 bg-white/4 h-[300px] flex flex-col items-center justify-center relative overflow-hidden">
       {/* Placeholder for map - in reality could use similar leaflet map */}
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
       <Activity className="w-12 h-12 text-indigo-500/50 mb-3" />
       <h3 className="text-gray-300 font-semibold mb-1 relative z-10">Regional Claim Heatmap</h3>
       <p className="text-xs text-gray-500 relative z-10">Visualized concentration of parametric payouts.</p>
       <div className="absolute bottom-4 right-4 flex gap-2">
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[10px] text-gray-400">High (12k+)</span></div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[10px] text-gray-400">Med (8k+)</span></div>
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
    <div className="glass-card rounded-2xl p-6 border border-white/10 bg-white/4 h-[300px]">
      <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase mb-4 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-rose-400" /> Fraud Attempt Trends
      </h3>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
          <Area type="monotone" dataKey="fraud" stroke="#f43f5e" fillOpacity={1} fill="url(#colorFraud)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RiskForecastPanel = () => {
  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10 bg-white/4">
      <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-amber-400" /> 7-Day Risk Forecast
      </h3>
      <div className="space-y-4">
        {[
          { label: 'Severe Rain (Delhi)', prob: '84%', impact: 'High', color: 'bg-red-500' },
          { label: 'Unrest (Zone 4)', prob: '42%', impact: 'Med', color: 'bg-amber-500' },
          { label: 'Traffic Spike (Fest)', prob: '95%', impact: 'Low', color: 'bg-emerald-500' },
        ].map((risk, i) => (
          <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-gray-200">{risk.label}</p>
              <p className="text-xs text-gray-500">Probability: {risk.prob}</p>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-white/10 text-white flex items-center gap-2 border border-white/10`}>
              <span className={`w-2 h-2 rounded-full ${risk.color}`}></span>
              {risk.impact} Impact
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
