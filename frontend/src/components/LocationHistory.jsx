import React from 'react';
import { MapPin, Navigation, Clock } from 'lucide-react';

export default function LocationHistory({ locationHistory = [] }) {
  if (!locationHistory || locationHistory.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6">
      <div className="pb-4 mb-4 border-b border-slate-800">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-400" /> Route Journey & Waypoints
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Chronological geographical transit updates reconstructed from event records.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 overflow-x-auto py-2">
        {locationHistory.map((loc, idx) => {
          const isLast = idx === locationHistory.length - 1;
          const dateStr = new Date(loc.timestamp).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <React.Fragment key={idx}>
              <div className={`p-3 rounded-lg border flex flex-col gap-1 min-w-[160px] ${
                isLast
                  ? 'bg-blue-950/20 border-blue-500/40 text-blue-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <MapPin className={`w-3.5 h-3.5 ${isLast ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className="truncate">{loc.location}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" /> {dateStr}
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-mono">
                  {loc.eventType?.replace(/_/g, ' ')}
                </div>
              </div>

              {!isLast && (
                <div className="text-slate-600 font-mono text-sm">→</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
