import React from 'react';
import { Container, MapPin, Activity, Thermometer, ShieldCheck, History, Ship, Building2, User } from 'lucide-react';

export default function ContainerSummary({ state, integrity, totalEvents, isHistorical = false }) {
  if (!state) return null;

  const isTempSpike = state.temperatureStatus === 'WARNING' || state.temperatureStatus === 'CRITICAL';

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Status Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Current Status</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-semibold text-slate-100 font-mono">
            {state.status?.replace(/_/g, ' ')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            {state.vesselName ? (
              <span className="flex items-center gap-1 text-slate-300"><Ship className="w-3 h-3" /> {state.vesselName}</span>
            ) : (
              <span>Standard Container</span>
            )}
          </div>
        </div>

        {/* Location Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Location</span>
            <MapPin className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-sm font-semibold text-slate-100 truncate" title={state.currentLocation}>
            {state.currentLocation || 'Unknown'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">
            {state.portName ? `At Port: ${state.portName}` : 'In Transit Zone'}
          </div>
        </div>

        {/* Temperature Card */}
        <div className={`border rounded-lg p-3.5 transition-colors ${
          isTempSpike
            ? 'bg-rose-950/20 border-rose-500/30'
            : 'bg-slate-950/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Temperature</span>
            <Thermometer className={`w-4 h-4 ${isTempSpike ? 'text-rose-400' : 'text-amber-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-base font-bold font-mono ${isTempSpike ? 'text-rose-300' : 'text-slate-100'}`}>
              {state.temperature !== null ? `${state.temperature.toFixed(1)}°C` : 'N/A'}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${
              isTempSpike
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {state.temperatureStatus || 'NORMAL'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isTempSpike ? '⚠️ Exceeds 8.0°C threshold' : 'Within normal limits'}
          </div>
        </div>

        {/* Integrity Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Integrity Status</span>
            <ShieldCheck className={`w-4 h-4 ${integrity?.valid ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div className="text-sm font-semibold font-mono flex items-center gap-1.5">
            {integrity?.valid ? (
              <span className="text-emerald-400 flex items-center gap-1">✓ SHA-256 Valid</span>
            ) : (
              <span className="text-rose-400">⚠️ Tampered</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {integrity?.eventsChecked !== undefined ? `${integrity.eventsChecked} events verified` : 'Cryptographic Chain'}
          </div>
        </div>
      </div>
    </div>
  );
}
