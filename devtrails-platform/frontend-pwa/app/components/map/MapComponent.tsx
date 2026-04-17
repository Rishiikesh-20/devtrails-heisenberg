'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getUser } from '../../lib/api';
import { getZoneByValue } from '../../lib/constants';

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
  const user = getUser();
  const zone = getZoneByValue(user?.zone);
  const center: [number, number] = [zone.lat, zone.lng];

  // Route Congestion coordinates
  const trafficRoute: [number, number][] = [
    [center[0], center[1]],
    [center[0] + 0.004, center[1] + 0.006],
    [center[0] + 0.009, center[1] + 0.012],
    [center[0] + 0.013, center[1] + 0.017],
  ];

  // Flood zones
  const floodZone: [number, number][] = [
    [center[0] - 0.018, center[1] + 0.01],
    [center[0] - 0.01, center[1] + 0.02],
    [center[0] - 0.024, center[1] + 0.03],
    [center[0] - 0.03, center[1] + 0.015],
  ];

  const markers = [
    {
      pos: [center[0], center[1]] as [number, number],
      title: `Signal Origin: ${zone.label}`,
      severity: 'High',
    },
    {
      pos: [center[0] - 0.014, center[1] + 0.018] as [number, number],
      title: `Impact Marker: ${zone.label}`,
      severity: 'Critical',
    },
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
