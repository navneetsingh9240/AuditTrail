import React, { useState, useEffect } from 'react';
import { GitCompare, ArrowRight } from 'lucide-react';
import * as api from '../services/api';

export default function StateDiffView({ containerId, maxVersion, events = [] }) {
  const [versionA, setVersionA] = useState(1);
  const [versionB, setVersionB] = useState(maxVersion || 1);
  const [stateA, setStateA] = useState(null);
  const [stateB, setStateB] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (maxVersion > 0) {
      setVersionB(maxVersion);
      setVersionA(Math.max(1, maxVersion - 1));
    }
  }, [maxVersion]);

  useEffect(() => {
    const fetchStates = async () => {
      if (!containerId || !versionA || !versionB) return;
      try {
        setLoading(true);
        const [resA, resB] = await Promise.all([
          api.getHistoricalState(containerId, { version: versionA }),
          api.getHistoricalState(containerId, { version: versionB }),
        ]);
        setStateA(resA.data?.state || null);
        setStateB(resB.data?.state || null);
      } catch (err) {
        console.error('Error fetching state diff:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStates();
  }, [containerId, versionA, versionB]);

  if (!events || events.length === 0) return null;

  const compareKeys = [
    { key: 'currentVersion', label: 'Aggregate Version' },
    { key: 'status', label: 'Status' },
    { key: 'currentLocation', label: 'Location / Waypoint' },
    { key: 'temperature', label: 'Temperature (°C)', format: (v) => (v !== null && v !== undefined ? `${Number(v).toFixed(1)}°C` : 'N/A') },
    { key: 'humidity', label: 'Humidity (%)', format: (v) => (v !== null && v !== undefined ? `${v}%` : 'N/A') },
    { key: 'doorOpen', label: 'Door Lock State', format: (v) => (v ? 'OPEN / UNLOCKED' : 'LOCKED') },
    { key: 'maxShockG', label: 'Max Shock Impact (G)', format: (v) => `${v || 0}G` },
    { key: 'geofenceBreached', label: 'Geofence Breach Flag', format: (v) => (v ? 'BREACHED' : 'NORMAL') },
    { key: 'temperatureStatus', label: 'Thermal Status' },
    { key: 'loaded', label: 'Loaded on Ship', format: (v) => (v ? 'Yes' : 'No') },
    { key: 'vesselName', label: 'Vessel Name', format: (v) => v || 'N/A' },
    { key: 'arrivedAtPort', label: 'Arrived at Port', format: (v) => (v ? 'Yes' : 'No') },
    { key: 'unloaded', label: 'Unloaded', format: (v) => (v ? 'Yes' : 'No') },
    { key: 'deliveryCompleted', label: 'Delivery Completed', format: (v) => (v ? 'Yes' : 'No') },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6">
      <div className="pb-4 mb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Side-by-Side Time Travel State Diff</h3>
            <p className="text-xs text-slate-400">
              Compare aggregate business state snapshot changes between any two version points in history.
            </p>
          </div>
        </div>

        {/* Version Selectors */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-semibold">Version A:</span>
            <select
              value={versionA}
              onChange={(e) => setVersionA(Number(e.target.value))}
              className="bg-slate-900 text-purple-300 font-bold px-2 py-0.5 rounded border border-slate-800 focus:outline-none"
            >
              {events.map((e) => (
                <option key={e.version} value={e.version}>
                  v{e.version} ({e.eventType})
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-500" />

          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-semibold">Version B:</span>
            <select
              value={versionB}
              onChange={(e) => setVersionB(Number(e.target.value))}
              className="bg-slate-900 text-blue-300 font-bold px-2 py-0.5 rounded border border-slate-800 focus:outline-none"
            >
              {events.map((e) => (
                <option key={e.version} value={e.version}>
                  v{e.version} ({e.eventType})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-mono text-xs">
          Calculating state diff across versions...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 uppercase">
                <th className="p-3">Field Property</th>
                <th className="p-3 text-purple-300">Snapshot at Version {versionA}</th>
                <th className="p-3 text-blue-300">Snapshot at Version {versionB}</th>
                <th className="p-3 text-right">Delta State Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {compareKeys.map(({ key, label, format }) => {
                const valA = stateA ? (format ? format(stateA[key]) : stateA[key]) : 'N/A';
                const valB = stateB ? (format ? format(stateB[key]) : stateB[key]) : 'N/A';
                const isChanged = String(valA) !== String(valB);

                return (
                  <tr
                    key={key}
                    className={`transition-colors ${
                      isChanged ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="p-3 font-semibold text-slate-300 font-sans">{label}</td>
                    <td className={`p-3 font-mono ${isChanged ? 'text-purple-300 font-bold' : 'text-slate-400'}`}>
                      {valA}
                    </td>
                    <td className={`p-3 font-mono ${isChanged ? 'text-blue-300 font-bold' : 'text-slate-400'}`}>
                      {valB}
                    </td>
                    <td className="p-3 text-right font-sans">
                      {isChanged ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold uppercase">
                          ⚡ Changed
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px] uppercase">Unchanged</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
