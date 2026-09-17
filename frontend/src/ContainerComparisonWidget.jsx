import React from 'react';
import { Layers, Thermometer, MapPin, ShieldCheck, Activity, ArrowRight } from 'lucide-react';

export default function ContainerComparisonWidget({ containers, onSelectContainer }) {
  if (!containers || containers.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/10 border border-blue-500/30 rounded-lg text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">Fleet Container Quick Compare</h3>
            <p className="text-[11px] text-slate-400">Live telemetry comparison overview across active read models</p>
          </div>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400 font-semibold">
          {containers.length} Units Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {containers.slice(0, 3).map((c) => {
          const isSpike = c.temperatureStatus === 'WARNING' || c.temperatureStatus === 'CRITICAL';

          return (
            <div
              key={c.containerId}
              onClick={() => onSelectContainer(c.containerId)}
              className="bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 rounded-lg p-3.5 space-y-2 cursor-pointer transition-all hover:bg-slate-950 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-blue-400 group-hover:text-blue-300 transition-colors">
                  {c.containerId}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  v{c.currentVersion}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400 flex items-center gap-1 font-sans text-[11px]">
                    <Activity className="w-3 h-3 text-emerald-400" /> Status
                  </span>
                  <span className="font-semibold text-[11px] uppercase">
                    {c.status?.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400 flex items-center gap-1 font-sans text-[11px]">
                    <MapPin className="w-3 h-3 text-blue-400" /> Location
                  </span>
                  <span className="text-[11px] truncate max-w-[120px]" title={c.currentLocation}>
                    {c.currentLocation || 'Unknown'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1 font-sans text-[11px]">
                    <Thermometer className="w-3 h-3 text-amber-400" /> Temp
                  </span>
                  <span className={`font-bold text-[11px] ${isSpike ? 'text-rose-400' : 'text-slate-200'}`}>
                    {c.temperature !== null && c.temperature !== undefined ? `${c.temperature.toFixed(1)}°C` : 'N/A'} {isSpike && '⚠️'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-900 flex justify-end">
                <span className="text-[11px] text-blue-400 flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform">
                  Inspect Stream <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
