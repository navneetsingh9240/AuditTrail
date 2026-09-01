import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Calendar, Navigation, ShieldAlert, Award } from 'lucide-react';

export default function DeliverySlaIndicator({ state }) {
  if (!state) return null;

  // Calculate simulated transit commitment dates based on container creation / status
  const createdDate = state.createdTimestamp ? new Date(state.createdTimestamp) : new Date(Date.now() - 5 * 24 * 3600 * 1000);
  const targetDeliveryDate = new Date(createdDate.getTime() + 7 * 24 * 3600 * 1000); // 7-day commitment
  const now = new Date();

  // Progress percentage calculation
  let progressPct = 0;
  if (state.deliveryCompleted) {
    progressPct = 100;
  } else if (state.unloaded) {
    progressPct = 85;
  } else if (state.arrivedAtPort) {
    progressPct = 70;
  } else if (state.loaded) {
    progressPct = 40;
  } else {
    progressPct = 15;
  }

  const isDelivered = state.deliveryCompleted;
  const isDelayed = !isDelivered && now > targetDeliveryDate;
  const daysRemaining = Math.max(0, Math.ceil((targetDeliveryDate - now) / (1000 * 60 * 60 * 24)));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6">
      <div className="pb-4 mb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" /> Today's Delivery SLA Commitment Indicator
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time fulfillment tracking against guaranteed carrier SLA transit commitment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDelivered ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> SLA FULFILLED ON-TIME
            </span>
          ) : isDelayed ? (
            <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" /> SLA AT RISK (DELAYED)
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> ON-TIME (COMMITMENT ACTIVE)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Commitment Progress Bar */}
        <div className="md:col-span-2 bg-slate-950/60 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-blue-400" /> Transit Progress
            </span>
            <span className="text-xs font-mono font-bold text-blue-400">{progressPct}% Complete</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDelivered
                  ? 'bg-emerald-500'
                  : isDelayed
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-blue-600 to-emerald-400'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
            <span>Created</span>
            <span>Loaded</span>
            <span>At Port</span>
            <span>Delivered</span>
          </div>
        </div>

        {/* Target Delivery Window */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
          <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400" /> Target Delivery Date
          </div>
          <div className="text-sm font-bold text-slate-100 font-mono">
            {targetDeliveryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Guaranteed Carrier SLA Window
          </div>
        </div>

        {/* SLA Remaining Window */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
          <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" /> SLA Countdown
          </div>
          <div className="text-sm font-bold font-mono text-emerald-400">
            {isDelivered ? '0 Days (Completed)' : `${daysRemaining} Days Remaining`}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {isDelivered ? 'Cargo final destination reached' : 'Commitment status active for today'}
          </div>
        </div>
      </div>
    </div>
  );
}
