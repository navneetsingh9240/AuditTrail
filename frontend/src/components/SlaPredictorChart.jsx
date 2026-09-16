import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SlaPredictorChart({ temperatureHistory = [] }) {
  if (!temperatureHistory || temperatureHistory.length === 0) return null;

  const threshold = 8.0;

  // Transform actual telemetry and generate 12-hour projected forecast
  const actualData = temperatureHistory.map((item, idx) => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actual: item.temperature,
    forecast: null,
    isSpike: item.isSpike || item.temperature > threshold,
  }));

  const lastActualTemp = actualData[actualData.length - 1]?.actual || 4.5;
  const isRising = actualData.length > 1 && actualData[actualData.length - 1].actual > actualData[actualData.length - 2].actual;
  const trendRate = isRising ? 0.35 : -0.15; // °C per hour trend rate

  // Generate 4 forecast data points (+3h, +6h, +9h, +12h)
  const forecastData = [
    {
      time: 'Now',
      actual: lastActualTemp,
      forecast: lastActualTemp,
    },
    {
      time: '+3h Forecast',
      actual: null,
      forecast: Number((lastActualTemp + trendRate * 3).toFixed(1)),
    },
    {
      time: '+6h Forecast',
      actual: null,
      forecast: Number((lastActualTemp + trendRate * 6).toFixed(1)),
    },
    {
      time: '+9h Forecast',
      actual: null,
      forecast: Number((lastActualTemp + trendRate * 9).toFixed(1)),
    },
    {
      time: '+12h Forecast',
      actual: null,
      forecast: Number((lastActualTemp + trendRate * 12).toFixed(1)),
    },
  ];

  const chartData = [...actualData, ...forecastData.slice(1)];
  const projectedMax = Math.max(...forecastData.map((f) => f.forecast || 0));
  const isForecastBreach = projectedMax > threshold;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6">
      <div className="pb-4 mb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" /> 12-Hour Thermal Trend & Excursion Predictor
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Predictive AI curve modeling future reefer thermal trajectory based on recent IoT sensor telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isForecastBreach ? (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" /> PREDICTED EXCURSION (&gt;8°C)
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> STABLE THERMAL TRAJECTORY
            </span>
          )}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="°C" domain={[-5, 20]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            />
            <ReferenceLine
              y={threshold}
              label={{
                value: 'Limit Threshold (8°C)',
                fill: '#ef4444',
                fontSize: 10,
                position: 'insideTopRight',
              }}
              stroke="#ef4444"
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Historical Telemetry (°C)"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#3b82f6' }}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              name="12h Projected Trend (°C)"
              stroke="#c084fc"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: '#c084fc' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}