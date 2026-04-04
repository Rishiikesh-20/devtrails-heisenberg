import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet Map to avoid SSR issues
const MapClient = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 border border-white/5 rounded-2xl">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
});

export const MapViewer = () => {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden glass-card shadow-2xl relative border border-white/10">
       <MapClient />
    </div>
  );
};
