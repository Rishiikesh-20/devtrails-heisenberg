'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js + Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const customPulseIcon = L.divIcon({
  className: 'custom-pulse-icon',
  html: `<div class="w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div><div class="w-4 h-4 bg-red-600 rounded-full absolute top-0 left-0"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export default function SignalMapClient() {
  const center: [number, number] = [28.6139, 77.2090]; // New Delhi center

  // Route Congestion coordinates
  const trafficRoute: [number, number][] = [
    [28.6139, 77.2090], [28.6200, 77.2150], [28.6250, 77.2200], [28.6300, 77.2280]
  ];

  // Flood zones
  const floodZone: [number, number][] = [
    [28.59, 77.24], [28.60, 77.26], [28.58, 77.28], [28.57, 77.25]
  ];

  const markers = [
    { pos: [28.6139, 77.2090] as [number, number], title: "Signal Origin: Traffic Lock", severity: "High" },
    { pos: [28.5850, 77.2600] as [number, number], title: "Place Marker: Yamuna River Overflow", severity: "Critical" }
  ];

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Route Congestion Overlay */}
        <Polyline
          positions={trafficRoute}
          color="#f59e0b"
          weight={6}
          opacity={0.8}
          dashArray="10, 10"
        />

        {/* Zone Impact Legend (Polygon) */}
        <Polygon
          positions={floodZone}
          color="#ef4444"
          fillColor="#ef4444"
          fillOpacity={0.2}
          weight={2}
        />

        {/* Place Markers */}
        {markers.map((m, idx) => (
          <Marker key={idx} position={m.pos} icon={customPulseIcon}>
            <Popup className="custom-popup">
              <div className="bg-gray-900 text-white p-2 rounded-lg border border-white/10 -m-3">
                <p className="font-bold text-sm mb-1">{m.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${m.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {m.severity} Severity
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
}
