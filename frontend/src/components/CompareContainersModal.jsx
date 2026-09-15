import React, { useState, useEffect } from 'react';
import { X, Layers, Thermometer, MapPin, ShieldCheck, Activity, Award, CheckCircle2 } from 'lucide-react';
import * as api from '../services/api';

export default function CompareContainersModal({ onClose }) {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllContainers = async () => {
      try {
        const res = await api.getContainers();
        const containerList = res.data || [];

        // Fetch detailed aggregate state for each container
        const detailedList = await Promise.all(
          containerList.map(async (c) => {
            try {
              const stateRes = await api.getContainerState(c.containerId);
              return stateRes.data;
            } catch (err) {
              return c;
            }
          })
        );

        setContainers(detailedList);
      } catch (err) {
        console.error('Error fetching containers for comparison matrix:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllContainers();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                Multi-Container Fleet Comparison Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Side-by-side comparative analytics evaluated across active container aggregates.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Matrix */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 font-mono text-xs">
            Loading container comparison matrix from Event Store...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {containers.map((c) => {
              const isTempSpike = c.temperatureStatus === 'WARNING' || c.temperatureStatus === 'CRITICAL';
              return (
                <div key={c.containerId} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
                  {/* Container Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div>
                      <span className="text-base font-bold text-blue-400 font-mono">{c.containerId}</span>
                      <p className="text-[10px] text-slate-400">{c.origin} → {c.destination}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-200">
                      v{c.currentVersion}
                    </span>
                  </div>

                  {/* Attributes */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" /> Status
                      </span>
                      <span className="font-mono font-semibold text-slate-200 uppercase text-[11px]">
                        {c.status?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" /> Location
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-[140px]" title={c.currentLocation}>
                        {c.currentLocation || 'Unknown'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Thermal / RH%
                      </span>
                      <span className={`font-mono font-bold ${isTempSpike ? 'text-rose-400' : 'text-slate-200'}`}>
                        {c.temperature !== null && c.temperature !== undefined ? `${c.temperature.toFixed(1)}°C` : 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-800/40">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Cargo Lock
                      </span>
                      <span className={`font-semibold ${c.doorOpen ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {c.doorOpen ? 'UNLOCKED' : 'LOCKED'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-purple-400" /> SLA Rating
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                        {isTempSpike ? 'SLA WARNING' : 'GRADE A+'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
