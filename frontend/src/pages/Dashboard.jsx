import React, { useState, useEffect } from 'react';
import {
  Layers,
  Container,
  ShieldCheck,
  TrendingUp,
  PlusCircle,
  RefreshCw,
  ArrowRight,
  Activity,
  Server,
  ShieldAlert
} from 'lucide-react';
import * as api from '../services/api';
import FleetRiskHeatmap from '../components/FleetRiskHeatmap';

export default function Dashboard({ onSelectContainer }) {
  const [activeTab, setActiveTab] = useState('LEDGER');
  const [containers, setContainers] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newContainerId, setNewContainerId] = useState('');
  const [owner, setOwner] = useState('Global Logistics Corp');
  const [origin, setOrigin] = useState('Singapore Terminal');
  const [destination, setDestination] = useState('Mumbai Port');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [contRes, riskRes] = await Promise.all([
        api.getContainers(),
        api.getFleetRiskAnalytics().catch(() => null)
      ]);
      setContainers(contRes.data || []);
      if (riskRes && riskRes.data) {
        setRiskData(riskRes.data);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch containers read model.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateNew = async (e) => {
    e.preventDefault();
    if (!newContainerId.trim()) return;
    try {
      setCreating(true);
      await api.createContainer({
        containerId: newContainerId.trim().toUpperCase(),
        owner,
        origin,
        destination,
      });
      setNewContainerId('');
      fetchDashboardData();
      onSelectContainer(newContainerId.trim().toUpperCase());
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setCreating(false);
    }
  };

  const activeShipments = containers.filter((c) => c.status !== 'DELIVERED').length;
  const totalBreaches = containers.filter((c) => c.temperatureStatus === 'WARNING' || c.temperatureStatus === 'CRITICAL').length;

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Total Tracked Containers</div>
            <div className="text-2xl font-bold font-mono text-white mt-1">{containers.length}</div>
          </div>
          <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Container className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Active Shipments</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{activeShipments}</div>
          </div>
          <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Thermal Breaches</div>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{totalBreaches}</div>
          </div>
          <div className="p-3 bg-rose-600/10 border border-rose-500/20 rounded-xl text-rose-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Ledger Immutability</div>
            <div className="text-sm font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> 100% SHA-256
            </div>
          </div>
          <div className="p-3 bg-purple-600/10 border border-purple-500/20 rounded-xl text-purple-400">
            <Server className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'LEDGER'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" /> Container Audit Index ({containers.length})
        </button>

        <button
          onClick={() => setActiveTab('RISK_MAP')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'RISK_MAP'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Fleet Risk Analytics & Heatmap
          {riskData?.totalIncidents > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-rose-950 text-rose-200 border border-rose-500/30 rounded-full text-[10px]">
              {riskData.totalIncidents}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'RISK_MAP' && (
        <FleetRiskHeatmap riskData={riskData} />
      )}

      {/* Main Containers Ledger List */}
      {activeTab === 'LEDGER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" /> Container Audit Ledger Index
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Read model projections derived from the append-only event store.
              </p>
            </div>

            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-mono font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Index
            </button>
          </div>

          {/* Create Container Form Accordion / Box */}
          <div className="bg-slate-950/60 p-4 border-b border-slate-800/80">
            <form onSubmit={handleCreateNew} className="flex flex-col md:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase font-mono">
                  Container ID
                </label>
                <input
                  type="text"
                  value={newContainerId}
                  onChange={(e) => setNewContainerId(e.target.value)}
                  placeholder="e.g. CNT-1004"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase font-mono">
                  Owner
                </label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Owner Company"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase font-mono">
                  Origin
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Origin Port"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase font-mono">
                  Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Destination Port"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shrink-0"
              >
                <PlusCircle className="w-4 h-4" /> Create Container
              </button>
            </form>
          </div>

          {/* Table / List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase font-mono text-slate-400">
                  <th className="p-4">Container ID</th>
                  <th className="p-4">Owner</th>
                  <th className="p-4">Current Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Temperature</th>
                  <th className="p-4 text-center">Version</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {containers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500 font-sans">
                      No container read models available. Click "Create Container" or seed the database.
                    </td>
                  </tr>
                ) : (
                  containers.map((c) => {
                    const isSpike = c.temperatureStatus === 'WARNING' || c.temperatureStatus === 'CRITICAL';
                    return (
                      <tr
                        key={c.containerId}
                        onClick={() => onSelectContainer(c.containerId)}
                        className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      >
                        <td className="p-4 font-bold text-blue-400 flex items-center gap-2">
                          <Container className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                          {c.containerId}
                        </td>
                        <td className="p-4 text-slate-300 font-sans">{c.owner || 'N/A'}</td>
                        <td className="p-4 text-slate-200">{c.currentLocation || 'Unknown'}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 font-semibold">
                            {c.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          {c.temperature !== null ? (
                            <span className={`font-bold ${isSpike ? 'text-rose-400' : 'text-slate-200'}`}>
                              {c.temperature.toFixed(1)}°C {isSpike && '⚠️'}
                            </span>
                          ) : (
                            <span className="text-slate-600">N/A</span>
                          )}
                        </td>
                        <td className="p-4 text-center font-bold text-slate-400">v{c.currentVersion}</td>
                        <td className="p-4 text-right">
                          <span className="inline-flex items-center gap-1 text-blue-400 group-hover:translate-x-0.5 transition-transform font-sans font-semibold text-xs">
                            Audit Trail <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
