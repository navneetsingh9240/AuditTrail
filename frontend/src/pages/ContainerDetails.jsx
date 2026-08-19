import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft, Layers, ShieldCheck, AlertCircle } from 'lucide-react';
import * as api from '../services/api';
import ContainerSummary from '../components/ContainerSummary';
import HistoricalSlider from '../components/HistoricalSlider';
import TemperatureChart from '../components/TemperatureChart';
import LocationHistory from '../components/LocationHistory';
import IntegrityBadge from '../components/IntegrityBadge';
import EventTimeline from '../components/EventTimeline';
import CommandPanel from '../components/CommandPanel';

export default function ContainerDetails({ containerId, onBack, socket }) {
  const [events, setEvents] = useState([]);
  const [currentState, setCurrentState] = useState(null);
  const [displayedState, setDisplayedState] = useState(null);
  const [integrity, setIntegrity] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContainerData = async (resetHistorical = false) => {
    try {
      setLoading(true);
      setError(null);

      const [stateRes, eventsRes, integrityRes] = await Promise.all([
        api.getContainerState(containerId),
        api.getContainerEvents(containerId),
        api.getContainerIntegrity(containerId),
      ]);

      setCurrentState(stateRes.data);
      setEvents(eventsRes.data || []);
      setIntegrity(integrityRes.data);

      if (resetHistorical || !selectedVersion) {
        setDisplayedState(stateRes.data);
        setSelectedVersion(stateRes.data?.currentVersion);
      } else {
        // Refresh historical state for currently selected version
        const histRes = await api.getHistoricalState(containerId, { version: selectedVersion });
        setDisplayedState(histRes.data?.state || stateRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Failed to load aggregate '${containerId}'.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainerData(true);
  }, [containerId]);

  // Listen for Socket.IO real-time events
  useEffect(() => {
    if (!socket) return;

    const handleEventAppended = (data) => {
      if (data.event?.aggregateId === containerId) {
        console.log('⚡ Socket.IO real-time event received:', data);
        fetchContainerData();
      }
    };

    socket.on('eventAppended', handleEventAppended);

    return () => {
      socket.off('eventAppended', handleEventAppended);
    };
  }, [socket, containerId, selectedVersion]);

  const handleVersionSelect = async (version) => {
    setSelectedVersion(version);
    if (version === currentState?.currentVersion) {
      setDisplayedState(currentState);
      return;
    }

    try {
      const res = await api.getHistoricalState(containerId, { version });
      if (res.data?.state) {
        setDisplayedState(res.data.state);
      }
    } catch (err) {
      console.error('Error scrubbing historical state:', err);
    }
  };

  if (loading && !displayedState) {
    return (
      <div className="py-20 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
        <p className="text-sm font-mono text-slate-400">Reconstructing container state from Event Store...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center max-w-lg mx-auto my-12 space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Container Aggregate Error</h3>
        <p className="text-xs text-slate-400 font-mono">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isHistorical = displayedState && currentState && displayedState.currentVersion !== currentState.currentVersion;

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-colors self-start shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-blue-400" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchContainerData()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-mono font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> Refresh Stream
          </button>
        </div>
      </div>

      {/* Container Summary Card */}
      <ContainerSummary
        state={displayedState}
        integrity={integrity}
        totalEvents={events.length}
        isHistorical={isHistorical}
      />

      {/* Time Travel Historical Slider */}
      <HistoricalSlider
        events={events}
        currentReconstructedVersion={selectedVersion}
        onVersionSelect={handleVersionSelect}
      />

      {/* Command Operations Panel */}
      <CommandPanel
        containerId={containerId}
        currentVersion={currentState?.currentVersion || 0}
        onCommandSuccess={() => fetchContainerData()}
      />

      {/* Sensor Metrics Chart */}
      <TemperatureChart
        temperatureHistory={displayedState?.temperatureHistory || []}
      />

      {/* Location Route History */}
      <LocationHistory
        locationHistory={displayedState?.locationHistory || []}
      />

      {/* Audit Integrity Panel */}
      <IntegrityBadge
        integrity={integrity}
        events={events}
      />

      {/* Full Event Timeline Stream */}
      <EventTimeline
        events={events}
      />
    </div>
  );
}
