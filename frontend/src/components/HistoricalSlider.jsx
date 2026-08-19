import React, { useState, useEffect } from 'react';
import { History, Play, RotateCcw, Clock, ArrowRight } from 'lucide-react';

export default function HistoricalSlider({ events = [], onVersionSelect, currentReconstructedVersion }) {
  const maxVersion = events.length;
  const [selectedVersion, setSelectedVersion] = useState(maxVersion || 1);

  useEffect(() => {
    if (maxVersion > 0) {
      setSelectedVersion(currentReconstructedVersion || maxVersion);
    }
  }, [maxVersion, currentReconstructedVersion]);

  if (!events || events.length === 0) return null;

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setSelectedVersion(val);
    onVersionSelect(val);
  };

  const selectedEvent = events.find((e) => e.version === selectedVersion) || events[events.length - 1];

  const handleReset = () => {
    setSelectedVersion(maxVersion);
    onVersionSelect(maxVersion);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6 border-l-4 border-l-amber-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Time Travel State Scrubbing
            </h3>
            <p className="text-xs text-slate-400">
              Drag the slider to reconstruct historical container state at any previous version.
            </p>
          </div>
        </div>

        {selectedVersion !== maxVersion && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-medium transition-colors shadow-sm self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Return to Present State (v{maxVersion})
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Slider input */}
        <div className="relative pt-2">
          <input
            type="range"
            min="1"
            max={maxVersion}
            value={selectedVersion}
            onChange={handleSliderChange}
            className="w-full h-2.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-2">
            <span>Version 1 (Creation)</span>
            <span className="text-amber-400 font-semibold">Active: Version {selectedVersion}</span>
            <span>Version {maxVersion} (Latest)</span>
          </div>
        </div>

        {/* Selected Point Summary Card */}
        {selectedEvent && (
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                v{selectedEvent.version}
              </span>
              <span className="font-mono font-bold text-white">{selectedEvent.eventType}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {new Date(selectedEvent.timestamp).toLocaleString()}
              </span>
              {selectedEvent.payload?.location && (
                <span className="text-slate-300">
                  Location: {selectedEvent.payload.location}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
