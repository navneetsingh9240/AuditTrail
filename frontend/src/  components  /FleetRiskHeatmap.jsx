import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, ShieldAlert, Thermometer, Zap, Navigation, Filter } from 'lucide-react';

const createRiskMarkerIcon = (riskLevel = 'MEDIUM', eventType = '') => {
  let color = '#f59e0b'; // Amber for MEDIUM
  if (riskLevel === 'CRITICAL') color = '#ef4444'; // Red for CRITICAL
  if (riskLevel === 'HIGH') color = '#f97316'; // Orange for HIGH

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="${color}" stroke="#0f172a" stroke-width="2">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-risk-marker',
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });
};

export default function FleetRiskHeatmap({ riskData }) {
  const [filterType, setFilterType] = useState('ALL');

  if (!riskData) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        Loading fleet risk analytics...
      </div>
    );
  }

  const { totalIncidents, criticalCount, highCount, incidents = [] } = riskData;

  const filteredIncidents = incidents.filter((inc) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'TEMPERATURE_SPIKE') return inc.eventType === 'TEMPERATURE_SPIKE';
    if (filterType === 'CARGO_SHOCK_DETECTED') return inc.eventType === 'CARGO_SHOCK_DETECTED';
    if (filterType === 'GEOFENCE_EXITED') return inc.eventType === 'GEOFENCE_EXITED';
    return true;
  });

  const defaultCenter = [18.0, 65.0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-8">
      {/* Header */}
      <div className="pb-4 mb-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" /> Interactive Fleet-Wide Risk Heatmap
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Geospatial density analysis of thermal breaches, mechanical shocks, and maritime geofence deviations derived from append-only IoT logs.
          </p>
        </div>

        {/* Risk Metrics Pills */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <div>
              <div className="text-[10px] text-rose-400 font-medium uppercase">Critical Risks</div>
              <div className="text-sm font-bold text-rose-200 font-mono">{criticalCount}</div>
            </div>
          </div>

          <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-amber-400 font-medium uppercase">High Risks</div>
              <div className="text-sm font-bold text-amber-200 font-mono">{highCount}</div>
            </div>
          </div>

          <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-[10px] text-blue-400 font-medium uppercase">Total Incidents</div>
              <div className="text-sm font-bold text-blue-200 font-mono">{totalIncidents}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4">
        <div className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filter Incidents:
        </div>
        {[
          { id: 'ALL', label: 'All Incidents', icon: ShieldAlert },
          { id: 'TEMPERATURE_SPIKE', label: 'Thermal Spikes', icon: Thermometer },
          { id: 'CARGO_SHOCK_DETECTED', label: 'Cargo Shocks', icon: Zap },
          { id: 'GEOFENCE_EXITED', label: 'Geofence Exits', icon: Navigation },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = filterType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Leaflet Map View */}
      <div className="h-96 w-full rounded-xl overflow-hidden border border-slate-800 relative z-0">
        <MapContainer
          center={defaultCenter}
          zoom={3}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {filteredIncidents.map((inc, idx) => {
            const position = [inc.latitude, inc.longitude];
            const isCritical = inc.riskLevel === 'CRITICAL';
            const radiusMeters = isCritical ? 250000 : 150000;
            const circleColor = isCritical ? '#ef4444' : inc.riskLevel === 'HIGH' ? '#f97316' : '#f59e0b';

            return (
              <React.Fragment key={inc.eventId || idx}>
                {/* Risk Density Circle Overlay */}
                <Circle
                  center={position}
                  radius={radiusMeters}
                  pathOptions={{
                    fillColor: circleColor,
                    fillOpacity: 0.25,
                    color: circleColor,
                    weight: 1.5,
                    opacity: 0.6,
                  }}
                />

                {/* Risk Location Marker */}
                <Marker position={position} icon={createRiskMarkerIcon(inc.riskLevel, inc.eventType)}>
                  <Popup className="dark-leaflet-popup">
                    <div className="p-1 font-sans text-xs space-y-1.5">
                      <div className="flex items-center justify-between border-b pb-1">
                        <span className="font-bold text-slate-900 font-mono">{inc.containerId}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono text-white uppercase ${
                            isCritical ? 'bg-rose-600' : 'bg-amber-600'
                          }`}
                        >
                          {inc.riskLevel}
                        </span>
                      </div>
                      <div className="text-slate-800 font-semibold flex items-center gap-1">
                        <span>Zone:</span> <strong className="font-mono">{inc.location}</strong>
                      </div>
                      <div className="text-slate-600 text-[11px] font-mono">
                        Event: <span className="uppercase text-slate-900 font-bold">{inc.eventType?.replace(/_/g, ' ')}</span>
                      </div>
                      {inc.details?.temperature && (
                        <div className="text-rose-600 font-mono text-[11px] font-bold">
                          Recorded Temp: {inc.details.temperature}°C (Limit 8.0°C)
                        </div>
                      )}
                      {inc.details?.gForce && (
                        <div className="text-amber-600 font-mono text-[11px] font-bold">
                          Mechanical Impact: {inc.details.gForce}G (Threshold 2.5G)
                        </div>
                      )}
                      <div className="text-slate-400 font-mono text-[10px]">
                        {new Date(inc.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
