import React from 'react';
import EventCard from './EventCard';
import { Layers } from 'lucide-react';

export default function EventTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm">No events found for this container aggregate.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" /> Immutable Event Stream History
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological append-only ledger for aggregate state derivation.
          </p>
        </div>
        <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-mono font-medium text-slate-300">
          {events.length} Events Total
        </span>
      </div>

      <div className="pt-2">
        {events.map((evt, idx) => (
          <EventCard key={evt.eventId || idx} event={evt} isLast={idx === events.length - 1} />
        ))}
      </div>
    </div>
  );
}
