import React, { useState } from 'react';
import EventCard from './EventCard';
import { Layers, Search, Filter, ShieldAlert, Navigation, Thermometer, Truck } from 'lucide-react';

export default function EventTimeline({ events = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  if (!events || events.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm">No events found for this container aggregate.</p>
      </div>
    );
  }

  // Filter events by search term and event category
  const filteredEvents = events.filter((evt) => {
    // 1. Search term filter
    const matchesSearch =
      !searchTerm ||
      evt.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.payload?.location && evt.payload.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (evt.payload?.vesselName && evt.payload.vesselName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (evt.payload?.owner && evt.payload.owner.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // 2. Category filter
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'MOVEMENT') {
      return ['CONTAINER_CREATED', 'LOADED_ON_SHIP', 'LOCATION_UPDATED', 'ARRIVED_AT_PORT', 'UNLOADED', 'DELIVERY_COMPLETED'].includes(evt.eventType);
    }
    if (activeCategory === 'TELEMETRY') {
      return ['TEMPERATURE_RECORDED', 'TEMPERATURE_SPIKE', 'HUMIDITY_SPIKE'].includes(evt.eventType);
    }
    if (activeCategory === 'SECURITY') {
      return ['DOOR_OPENED', 'DOOR_CLOSED', 'GEOFENCE_EXITED', 'UNAUTHORIZED_ROUTE_DEVIATION'].includes(evt.eventType);
    }

    return true;
  });

  // Count badges
  const movementCount = events.filter((e) => ['CONTAINER_CREATED', 'LOADED_ON_SHIP', 'LOCATION_UPDATED', 'ARRIVED_AT_PORT', 'UNLOADED', 'DELIVERY_COMPLETED'].includes(e.eventType)).length;
  const telemetryCount = events.filter((e) => ['TEMPERATURE_RECORDED', 'TEMPERATURE_SPIKE', 'HUMIDITY_SPIKE'].includes(e.eventType)).length;
  const securityCount = events.filter((e) => ['DOOR_OPENED', 'DOOR_CLOSED', 'GEOFENCE_EXITED', 'UNAUTHORIZED_ROUTE_DEVIATION'].includes(e.eventType)).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" /> Immutable Event Stream History
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological append-only ledger for aggregate state derivation.
          </p>
        </div>
        <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-mono font-medium text-slate-300 self-start sm:self-auto">
          {events.length} Events Total
        </span>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'ALL', label: 'All Events', count: events.length, icon: Layers },
            { id: 'MOVEMENT', label: 'Logistics', count: movementCount, icon: Truck },
            { id: 'TELEMETRY', label: 'Thermal Telemetry', count: telemetryCount, icon: Thermometer },
            { id: 'SECURITY', label: 'Security & Alerts', count: securityCount, icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Text Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search event type or location..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Event Stream List */}
      <div className="pt-2">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs bg-slate-950/60 rounded-xl border border-slate-800">
            No events match your filter criteria "{searchTerm}".
          </div>
        ) : (
          filteredEvents.map((evt, idx) => (
            <EventCard key={evt.eventId || idx} event={evt} isLast={idx === filteredEvents.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}
