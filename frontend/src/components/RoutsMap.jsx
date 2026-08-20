import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Clock } from 'lucide-react';

// Known coordinate mappings for maritime ports & transit waypoints
const LOCATION_COORDINATES = {
  'Singapore Port': [1.29027, 103.85195],
  'Singapore Terminal 3': [1.2655, 103.8201],
  'Malacca Strait': [2.5, 101.5],
  'Arabian Sea': [15.0, 65.0],
  'Arabian Sea (Approaching Outer Anchorage)': [18.5, 71.5],
  'Mumbai Port': [18.9438, 72.8358],
  'Mumbai Port Berth 4': [18.9501, 72.8422],
  'Rotterdam Port': [51.9244, 4.4777],
  'Rotterdam ECT Gateway': [51.9561, 4.0538],
  'North Atlantic Ocean': [38.0, -40.0],
  'New York Container Terminal': [40.6413, -74.0776],
  'New York Berth 2': [40.6500, -74.0800],
  'New York Container Yard A': [40.6600, -74.0850],
  'New Jersey Distribution Center': [40.7357, -74.1724],
  'Hamburg Port': [53.5511, 9.9937],
  'Hamburg Logistics Hub': [53.5200, 9.9600],
  'Hamburg Terminal 1': [53.5100, 9.9400],
  'Suez Canal': [29.9323, 32.5599],
  'Red Sea Transit Zone': [20.0, 38.5],
  'Dubai Jebel Ali': [24.9857, 55.0611],
  'Origin Port': [1.29, 103.85],
  'Destination Port': [18.94, 72.83],
};

// Create custom colored marker icons
const createMarkerIcon = (color = '#3b82f6', isLast = false) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${isLast ? 36 : 28}" height="${isLast ? 36 : 28}" fill="${color}" stroke="#0f172a" stroke-width="2">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svg,
    iconSize: [isLast ? 36 : 28, isLast ? 36 : 28],
    iconAnchor: [isLast ? 18 : 14, isLast ? 36 : 28],
    popupAnchor: [0, isLast ? -32 : -24],
  });
};

export default function RouteMap({ locationHistory = [] }) {
  if (!locationHistory || locationHistory.length === 0) return null;

  // Extract valid points with coordinates
  const waypoints = locationHistory
    .map((item) => {
      const coords = LOCATION_COORDINATES[item.location] || LOCATION_COORDINATES[item.portName] || null;
      return {
        ...item,
        coords,
      };
    })
    .filter((w) => w.coords !== null);

  if (waypoints.length === 0) return null;

  const polylineCoords = waypoints.map((w) => w.coords);
  const centerCoord = waypoints[waypoints.length - 1].coords;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6">
      <div className="pb-4 mb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-400" /> Geospatial Route Tracker & GIS Map
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive GIS plotting derived directly from location history event coordinates.
          </p>
        </div>
        <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-mono font-medium text-blue-400">
          {waypoints.length} Geocoded Waypoints
        </span>
      </div>

      <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-800 relative z-0">
        <MapContainer
          center={centerCoord}
          zoom={4}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}
        >
          {/* Dark Mode TileLayer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Polyline connecting route waypoints */}
          <Polyline
            positions={polylineCoords}
            color="#3b82f6"
            weight={3.5}
            opacity={0.85}
            dashArray="6, 8"
          />

          {/* Render Waypoint Markers */}
          {waypoints.map((wp, idx) => {
            const isLast = idx === waypoints.length - 1;
            const isSpike = wp.eventType === 'TEMPERATURE_SPIKE';
            const color = isSpike ? '#ef4444' : isLast ? '#10b981' : '#3b82f6';
            const dateStr = new Date(wp.timestamp).toLocaleString();

            return (
              <Marker
                key={idx}
                position={wp.coords}
                icon={createMarkerIcon(color, isLast)}
              >
                <Popup className="dark-leaflet-popup">
                  <div className="p-1 font-sans text-xs space-y-1">
                    <div className="font-bold text-slate-900 border-b pb-1 font-mono">{wp.location}</div>
                    <div className="text-slate-700 font-mono text-[11px] flex items-center gap-1">
                      <span>Event:</span> <strong className="uppercase">{wp.eventType?.replace(/_/g, ' ')}</strong>
                    </div>
                    <div className="text-slate-500 font-mono text-[10px]">{dateStr}</div>
                    {isLast && (
                      <div className="text-emerald-600 font-bold text-[10px] uppercase">
                        Current Position
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
