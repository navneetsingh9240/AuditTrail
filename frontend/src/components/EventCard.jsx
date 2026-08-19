import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Hash, Clock, MapPin, Layers } from 'lucide-react';

export default function EventCard({ event, isLast = false }) {
  const [expanded, setExpanded] = useState(false);

  const isSpike = event.eventType === 'TEMPERATURE_SPIKE';
  const formattedDate = new Date(event.timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  return (
    <div className="relative pl-8 pb-6 group">
      {/* Connector Line */}
      {!isLast && (
        <span className="absolute left-[15px] top-6 bottom-0 w-0.5 bg-slate-800 group-hover:bg-blue-500/50 transition-colors" />
      )}

      {/* Node Icon Circle */}
      <span
        className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold font-mono transition-transform group-hover:scale-105 shadow-md ${
          isSpike
            ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-rose-900/30'
            : 'bg-slate-900 border-blue-500 text-blue-400'
        }`}
      >
        {isSpike ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : event.version}
      </span>

      {/* Card Content */}
      <div className={`rounded-xl border transition-all ${
        isSpike
          ? 'bg-rose-950/10 border-rose-900/40 hover:border-rose-700/60'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}>
        <div
          onClick={() => setExpanded(!expanded)}
          className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`text-sm font-bold font-mono tracking-wide ${isSpike ? 'text-rose-300' : 'text-slate-100'}`}>
                {event.eventType}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                v{event.version}
              </span>
              {isSpike && (
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Critical Alert
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> {formattedDate}
              </span>
              {event.payload?.location && (
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" /> {event.payload.location}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
            <span className="text-xs font-mono text-slate-500 truncate max-w-[120px]">
              {event.eventId}
            </span>
            <button className="p-1 rounded hover:bg-slate-800 text-slate-400">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Payload & Cryptographic Proof Details */}
        {expanded && (
          <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/40 rounded-b-xl text-xs space-y-3">
            <div>
              <span className="text-slate-400 font-semibold mb-1 block">Payload Data:</span>
              <pre className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg text-slate-300 font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 flex items-center gap-1 font-mono">
                  <Hash className="w-3 h-3 text-slate-400" /> Previous Hash:
                </span>
                <span className="font-mono text-slate-400 truncate max-w-[280px]">
                  {event.previousHash || '0000000000000000000000000000000000000000000000000000000000000000 (GENESIS)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-blue-400 font-semibold flex items-center gap-1 font-mono">
                  <Hash className="w-3 h-3 text-blue-400" /> Event SHA-256 Hash:
                </span>
                <span className="font-mono text-blue-300 font-semibold truncate max-w-[280px]">
                  {event.eventHash}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
