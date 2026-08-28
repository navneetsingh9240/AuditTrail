import React from 'react';
import { ShieldCheck, AlertTriangle, Thermometer, CheckCircle2, XCircle, Activity, Gauge } from 'lucide-react';

export default function ColdChainSlaMetrics({ temperatureHistory = [], threshold = 8.0 }) {
  if (!temperatureHistory || temperatureHistory.length === 0) return null;

  const totalReadings = temperatureHistory.length;
  const spikeReadings = temperatureHistory.filter((t) => t.isSpike || t.temperature > threshold);
  const normalReadingsCount = totalReadings - spikeReadings.length;

  const stabilityRate = totalReadings > 0 ? ((normalReadingsCount / totalReadings) * 100).toFixed(1) : '100.0';
  const isSlaCompliant = spikeReadings.length === 0;

  const temperatures = temperatureHistory.map((t) => t.temperature);
  const avgTemp = (temperatures.reduce((a, b) => a + b, 0) / totalReadings).toFixed(1);
  const maxTemp = Math.max(...temperatures).toFixed(1);
  const minTemp = Math.min(...temperatures).toFixed(1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Cold-Chain SLA Compliance Analytics
            </h3>
            <p className="text-xs text-slate-400">
              Automated thermal stability rate and SLA breach evaluation derived from IoT event logs.
            </p>
          </div>
        </div>

        {/* SLA Status Pill */}
        <div
          className={`px-3.5 py-1.5 rounded-full border text-xs font-bold font-mono uppercase flex items-center gap-1.5 self-start sm:self-auto ${
            isSlaCompliant
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {isSlaCompliant ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> SLA COMPLIANT
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" /> SLA BREACHED ({spikeReadings.length} Excursions)
            </>
          )}
        </div>
      </div>

      {/* SLA Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
        {/* Thermal Stability Rate */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-blue-400" /> Stability Rate
          </span>
          <div className="text-xl font-black text-white">{stabilityRate}%</div>
          <p className="text-[10px] text-slate-400 font-sans">
            {normalReadingsCount} of {totalReadings} within limit
          </p>
        </div>

        {/* Total Excursions */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Thermal Excursions
          </span>
          <div className={`text-xl font-black ${spikeReadings.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {spikeReadings.length} Spikes
          </div>
          <p className="text-[10px] text-slate-400 font-sans">Threshold limit: {threshold}°C</p>
        </div>

        {/* Average Temperature */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Mean Temperature
          </span>
          <div className="text-xl font-black text-slate-200">{avgTemp}°C</div>
          <p className="text-[10px] text-slate-400 font-sans">Min: {minTemp}°C | Max: {maxTemp}°C</p>
        </div>

        {/* SLA Assessment */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
          <span className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Insurance SLA Status
          </span>
          <div className={`text-sm font-bold uppercase truncate ${isSlaCompliant ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isSlaCompliant ? '100% Valid Cargo' : 'High Risk Loss'}
          </div>
          <p className="text-[10px] text-slate-400 font-sans">
            {isSlaCompliant ? 'No claim required' : 'Requires audit review'}
          </p>
        </div>
      </div>
    </div>
  );
}
