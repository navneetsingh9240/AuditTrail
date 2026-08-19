import React, { useState } from 'react';
import { PlusCircle, Ship, MapPin, Thermometer, CheckCircle2, PackageCheck, AlertCircle, RefreshCw } from 'lucide-react';
import * as api from '../services/api';

export default function CommandPanel({ containerId, currentVersion, onCommandSuccess }) {
  const [activeTab, setActiveTab] = useState('move');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form state
  const [vesselName, setVesselName] = useState('MV Blue Wave');
  const [location, setLocation] = useState('');
  const [temperature, setTemperature] = useState('6.5');
  const [portName, setPortName] = useState('');
  const [recipient, setRecipient] = useState('');
  const [customVersion, setCustomVersion] = useState(currentVersion);
  const [simulateOCCConflict, setSimulateOCCConflict] = useState(false);

  const clearMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handleExecuteCommand = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    // If simulate OCC conflict checked, pass an outdated version
    const expectedVersion = simulateOCCConflict ? Math.max(0, currentVersion - 1) : currentVersion;

    try {
      let res;
      if (activeTab === 'load') {
        res = await api.loadContainer(containerId, { vesselName, location: location || 'Origin Wharf', expectedVersion });
      } else if (activeTab === 'move') {
        if (!location) throw new Error('Location is required for movement update.');
        res = await api.moveContainer(containerId, { location, expectedVersion });
      } else if (activeTab === 'temp') {
        if (!temperature) throw new Error('Temperature reading is required.');
        res = await api.recordTemperature(containerId, { temperature: Number(temperature), location: location || 'Sea Transit', expectedVersion });
      } else if (activeTab === 'arrive') {
        res = await api.arriveContainer(containerId, { portName: portName || location || 'Destination Port', location: location || portName, expectedVersion });
      } else if (activeTab === 'unload') {
        res = await api.unloadContainer(containerId, { location: location || 'Port Yard A', expectedVersion });
      } else if (activeTab === 'complete') {
        res = await api.completeDelivery(containerId, { location: location || 'Final Warehouse', recipient: recipient || 'Logistics Receiver', expectedVersion });
      }

      setSuccessMsg(`Command executed! Appended version ${res.event?.version}`);
      setLocation('');
      if (onCommandSuccess) onCommandSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to execute command.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-400" /> Command Operations Engine
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Issue domain actions to generate new immutable events for container <strong className="text-slate-200 font-mono">{containerId}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-amber-400 font-medium cursor-pointer bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded">
            <input
              type="checkbox"
              checked={simulateOCCConflict}
              onChange={(e) => setSimulateOCCConflict(e.target.checked)}
              className="accent-amber-500"
            />
            Simulate OCC Conflict (v{Math.max(0, currentVersion - 1)})
          </label>
        </div>
      </div>

      {/* Operation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4">
        {[
          { id: 'load', label: 'Load on Ship', icon: Ship },
          { id: 'move', label: 'Move Location', icon: MapPin },
          { id: 'temp', label: 'Telemetry Sensor', icon: Thermometer },
          { id: 'arrive', label: 'Arrive Port', icon: CheckCircle2 },
          { id: 'unload', label: 'Unload', icon: PackageCheck },
          { id: 'complete', label: 'Complete Delivery', icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                clearMessages();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Form Area */}
      <form onSubmit={handleExecuteCommand} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeTab === 'load' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Vessel Name</label>
              <input
                type="text"
                value={vesselName}
                onChange={(e) => setVesselName(e.target.value)}
                placeholder="e.g. MV Majestic Sapphire"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          )}

          {activeTab === 'temp' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="e.g. 12.5 (>8°C triggers SPIKE)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          )}

          {activeTab === 'arrive' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Port Name</label>
              <input
                type="text"
                value={portName}
                onChange={(e) => setPortName(e.target.value)}
                placeholder="e.g. Mumbai Port Terminal 2"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          )}

          {activeTab === 'complete' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Recipient Name</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Apex Global Warehousing"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Location / Waypoint</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Arabian Sea Crossing"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-xs text-rose-300 flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Execute & Append Event
          </button>
        </div>
      </form>
    </div>
  );
}
