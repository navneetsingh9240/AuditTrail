import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Thermometer, AlertTriangle } from 'lucide-react';

export default function TemperatureChart({ temperatureHistory = [], threshold = 8.0 }) {
  if (!temperatureHistory || temperatureHistory.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400 mb-6">
        <Thermometer className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm">No sensor temperature data recorded for this container.</p>
      </div>
    );
  }

  const chartData = temperatureHistory.map((item, index) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fullTime: new Date(item.timestamp).toLocaleString(),
    temperature: item.temperature,
    threshold: threshold,
    location: item.location || 'In Transit',
    isSpike: item.isSpike || item.temperature > threshold,
    idx: index + 1,
  }));

  const spikes = chartData.filter((d) => d.isSpike);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-amber-400" /> Cold-Chain Telemetry & Thermal Audit
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time IoT temperature sensor tracking with threshold breach indicators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Threshold: {threshold}°C
          </div>
          {spikes.length > 0 && (
            <div className="flex items-center gap-1 text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> {spikes.length} Thermal Breaches
            </div>
          )}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              unit="°C"
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg shadow-xl text-xs space-y-1">
                      <div className="font-bold font-mono text-slate-200">{data.fullTime}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Temperature:</span>
                        <span className={`font-mono font-bold ${data.isSpike ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {data.temperature}°C
                        </span>
                      </div>
                      <div className="text-slate-400">
                        Location: <span className="text-slate-200">{data.location}</span>
                      </div>
                      {data.isSpike && (
                        <div className="text-rose-400 font-semibold pt-1 border-t border-slate-800 text-[11px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> TEMPERATURE_SPIKE Detected
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={threshold}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: `Limit (${threshold}°C)`, fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload, index } = props;
                if (payload.isSpike) {
                  return (
                    <circle
                      key={`dot-${index}`}
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  );
                }
                return (
                  <circle
                    key={`dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="#3b82f6"
                    stroke="#0f172a"
                    strokeWidth={1.5}
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
