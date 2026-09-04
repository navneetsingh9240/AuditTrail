import React, { useState } from 'react';
import { Bell, X, AlertTriangle, ShieldAlert, DoorOpen, Thermometer, NavigationOff, CheckCircle2, Trash2 } from 'lucide-react';

export default function NotificationDrawer({ notifications = [], onClearNotifications }) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.length;

  const getIcon = (type) => {
    switch (type) {
      case 'TEMPERATURE_SPIKE':
        return <Thermometer className="w-4 h-4 text-rose-400" />;
      case 'DOOR_OPENED':
        return <DoorOpen className="w-4 h-4 text-amber-400" />;
      case 'GEOFENCE_EXITED':
        return <NavigationOff className="w-4 h-4 text-purple-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Top Header Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors flex items-center justify-center shadow-sm"
        title="Real-Time Anomaly Notifications"
      >
        <Bell className="w-4 h-4 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-rose-500 text-white font-mono text-[10px] font-bold rounded-full animate-pulse border border-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-over Notification Drawer Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Anomaly Alert Stream
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-semibold">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={onClearNotifications}
                  className="p-1 text-slate-500 hover:text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
                  title="Clear All Alerts"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-2">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">No real-time anomalies detected.</p>
                <p className="text-[10px] text-slate-500">All cold-chain telemetry and security seals are nominal.</p>
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/50 hover:bg-slate-950 rounded-xl border border-slate-800/80 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                        {getIcon(notif.eventType)}
                      </div>
                      <span className="text-xs font-bold text-slate-200 font-mono uppercase">
                        {notif.eventType?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(notif.timestamp || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-mono pl-8">
                    Container: <strong className="text-blue-400">{notif.aggregateId}</strong>
                    {notif.payload?.temperature !== undefined && (
                      <span className="ml-2 text-rose-400 font-bold">
                        Temp: {notif.payload.temperature}°C
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 pl-8 font-mono">
                    {notif.payload?.location || notif.payload?.message || 'High-risk event appended to Event Store.'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
