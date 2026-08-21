import React from 'react';
import { Container, MapPin, Activity, Thermometer, ShieldCheck, History, Ship, DoorClosed, DoorOpen, Zap, NavigationOff } from 'lucide-react';

export default function ContainerSummary({ state, integrity, totalEvents, isHistorical = false }) {
  if (!state) return null;

  const isTempSpike = state.temperatureStatus === 'WARNING' || state.temperatureStatus === 'CRITICAL';
  const isHumiditySpike = state.humidityStatus === 'WARNING';
  const isShockSpike = (state.maxShockG || 0) > 2.5;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-5 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Container className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-mono text-white tracking-wide">{state.containerId}</h2>
              {isHistorical && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center gap-1">
                  <History className="w-3 h-3" /> Historical Snapshot
                </span>
              )}
              {state.geofenceBreached && (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold uppercase flex items-center gap-1 animate-pulse">
                  <NavigationOff className="w-3 h-3" /> Geofence Breach
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Owner: <strong className="text-slate-300 font-normal">{state.owner || 'N/A'}</strong></span>
              <span>•</span>
              <span>Route: <strong className="text-slate-300 font-normal">{state.origin} → {state.destination}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Version</div>
            <div className="text-base font-bold font-mono text-blue-400">v{state.currentVersion}</div>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Total Events</div>
            <div className="text-base font-bold font-mono text-slate-200">{totalEvents || state.currentVersion}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Status Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Status</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xs font-semibold text-slate-100 font-mono truncate">
            {state.status?.replace(/_/g, ' ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            {state.vesselName ? (
              <span className="flex items-center gap-1 text-slate-300"><Ship className="w-3 h-3" /> {state.vesselName}</span>
            ) : (
              'Standard Cargo'
            )}
          </div>
        </div>

        {/* Location Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Location</span>
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xs font-semibold text-slate-100 truncate" title={state.currentLocation}>
            {state.currentLocation || 'Unknown'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            {state.portName ? `At: ${state.portName}` : 'In Corridor'}
          </div>
        </div>

        {/* Temperature & Humidity Card */}
        <div className={`border rounded-lg p-3 transition-colors ${
          isTempSpike || isHumiditySpike
            ? 'bg-rose-950/20 border-rose-500/30'
            : 'bg-slate-950/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Thermal / RH%</span>
            <Thermometer className={`w-3.5 h-3.5 ${isTempSpike ? 'text-rose-400' : 'text-amber-400'}`} />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-xs font-bold font-mono ${isTempSpike ? 'text-rose-300' : 'text-slate-100'}`}>
              {state.temperature !== null ? `${state.temperature.toFixed(1)}°C` : 'N/A'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              RH: {state.humidity !== null ? `${state.humidity}%` : 'N/A'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {isTempSpike ? '⚠️ Exceeds 8°C Limit' : 'Thermal Limits Normal'}
          </div>
        </div>

        {/* Security & Shock Card */}
        <div className={`border rounded-lg p-3 ${
          isShockSpike || state.doorOpen ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-950/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Door / Shock G</span>
            {state.doorOpen ? <DoorOpen className="w-3.5 h-3.5 text-amber-400" /> : <DoorClosed className="w-3.5 h-3.5 text-emerald-400" />}
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${state.doorOpen ? 'text-amber-300' : 'text-emerald-400'}`}>
              {state.doorOpen ? 'DOOR OPEN' : 'LOCKED'}
            </span>
            <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${isShockSpike ? 'text-rose-400' : 'text-slate-300'}`}>
              <Zap className="w-3 h-3" /> {state.maxShockG || 0}G
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            {isShockSpike ? '⚠️ Cargo Shock Alert' : 'Normal Shock Levels'}
          </div>
        </div>

        {/* Integrity Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">Integrity</span>
            <ShieldCheck className={`w-3.5 h-3.5 ${integrity?.valid ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div className="text-xs font-semibold font-mono truncate">
            {integrity?.valid ? (
              <span className="text-emerald-400">✓ SHA-256 Intact</span>
            ) : (
              <span className="text-rose-400">⚠️ Chain Tampered</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {integrity?.eventsChecked !== undefined ? `${integrity.eventsChecked} Verified` : 'Audit Chain'}
          </div>
        </div>
      </div>
    </div>
  );
}
