import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, FileText, FileSearch, Banknote, HelpCircle, Activity } from 'lucide-react';

const routes = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'My Policy', path: '/policy', icon: FileText },
  { name: 'Claims', path: '/claims', icon: FileSearch },
  { name: 'Payouts', path: '/payouts', icon: Banknote },
];

// Temporarily moved/hidden simulation features
const simulationRoutes = [
  { name: 'Simulation Engine', path: '/demo/simulator', icon: Activity, hidden: true },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-gray-950 border-r border-white/10 flex flex-col hidden md:flex sticky top-0">
      <div className="p-6 h-20 flex items-center border-b border-white/10">
        <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-extrabold text-lg leading-none">D</span>
          </div>
          DevTrails
        </Link>
      </div>

      <nav className="flex-1 py-8 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3">
          Main Menu
        </div>

        {routes.map((route) => {
          const Icon = route.icon;
          return (
            <Link
              key={route.path}
              href={route.path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
            >
              <Icon className="w-5 h-5 text-gray-500 group-hover:text-indigo-400 transition-colors" />
              <span className="font-medium">{route.name}</span>
            </Link>
          );
        })}

        {/* Demo/Sim routes isolated and hidden by default */}
        {simulationRoutes.filter(r => !r.hidden).length > 0 && (
          <>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-8 mb-4 px-3">
              Developer Tools
            </div>
            {simulationRoutes.filter(r => !r.hidden).map((route) => {
              const Icon = route.icon;
              return (
                <Link
                  key={route.path}
                  href={route.path}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-500/20 group"
                >
                  <Icon className="w-5 h-5 text-indigo-500/50 group-hover:text-indigo-400 transition-colors" />
                  <span className="font-medium">{route.name}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-white/10 mt-auto">
        <Link
          href="/support"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="font-medium">Get Support</span>
        </Link>
      </div>
    </aside>
  );
};
