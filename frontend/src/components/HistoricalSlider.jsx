import React, { useState, useEffect } from 'react';
import { History, Play, Pause, RotateCcw, Clock, FastForward } from 'lucide-react';

export default function HistoricalSlider({ events = [], onVersionSelect, currentReconstructedVersion }) {
  const maxVersion = events.length;
  const [selectedVersion, setSelectedVersion] = useState(maxVersion || 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms per step

  useEffect(() => {
    if (maxVersion > 0 && !isPlaying) {
      setSelectedVersion(currentReconstructedVersion || maxVersion);
    }
  }, [maxVersion, currentReconstructedVersion, isPlaying]);

  // Playback timer effect
  useEffect(() => {
    let timer = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setSelectedVersion((prev) => {
          if (prev >= maxVersion) {
            setIsPlaying(false);
            return maxVersion;
          }
          const next = prev + 1;
          onVersionSelect(next);
          return next;
        });
      }, playbackSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, maxVersion, playbackSpeed, onVersionSelect]);

  if (!events || events.length === 0) return null;

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setSelectedVersion(val);
    onVersionSelect(val);
  };

  const selectedEvent = events.find((e) => e.version === selectedVersion) || events[events.length - 1];

  const handleReset = () => {
    setIsPlaying(false);
    setSelectedVersion(maxVersion);
    onVersionSelect(maxVersion);
  };

  const togglePlayback = () => {
    if (selectedVersion >= maxVersion) {
      setSelectedVersion(1);
      onVersionSelect(1);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6 border-l-4 border-l-amber-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Time Travel State Scrubbing & Auto-Replay
            </h3>
            <p className="text-xs text-slate-400">
              Scrub the timeline or play historical event progression to visualize state evolution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Play / Pause Toggle Button */}
          <button
            onClick={togglePlayback}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-400'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isPlaying ? 'Pause Replay' : 'Auto Replay'}
          </button>

          {/* Speed Toggle */}
          <button
            onClick={() => setPlaybackSpeed(playbackSpeed === 1000 ? 500 : playbackSpeed === 500 ? 250 : 1000)}
            className="flex items-center gap-1 px-2 py-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-[11px] font-mono font-bold"
            title="Toggle Replay Speed"
          >
            <FastForward className="w-3 h-3 text-amber-400" />
            {playbackSpeed === 1000 ? '1x' : playbackSpeed === 500 ? '2x' : '4x'}
          </button>

          {selectedVersion !== maxVersion && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Present (v{maxVersion})
            </button>
          )}
        </div>
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
