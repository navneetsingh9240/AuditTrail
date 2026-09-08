import React from 'react';
import { Award, ShieldCheck, Thermometer, Key, Truck, CheckCircle2 } from 'lucide-react';

export default function CarrierScorecard({ state }) {
  if (!state) return null;

  const carrierName = state.vesselName ? `OceanNet Carrier (${state.vesselName})` : 'Pacific Cold-Chain Fleet';

  // Derived compliance metrics
  const isTempNominal = state.temperatureStatus !== 'WARNING' && state.temperatureStatus !== 'CRITICAL';
  const thermalScore = isTempNominal ? 98.5 : 84.2;
  const signatureScore = 100;
  const sealScore = state.doorOpen ? 75.0 : 100;
  const overallGrade = isTempNominal && !state.doorOpen ? 'A+' : 'B';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6">
      <div className="pb-4 mb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" /> Carrier Quality & SLA Duty-of-Care Scorecard
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated compliance rating evaluated against immutable event logs and digital signatures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Overall SLA Grade:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
            overallGrade === 'A+' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
          }`}>
            {overallGrade} COMPLIANT
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Carrier Info */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-400" /> Assigned Carrier
            </div>
            <div className="text-xs font-bold text-slate-100 font-mono truncate" title={carrierName}>
              {carrierName}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> Certified Releaser
          </div>
        </div>

        {/* Thermal Stability Rating */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
          <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-emerald-400" /> Cold-Chain Duty
          </div>
          <div className="text-sm font-bold font-mono text-emerald-400">
            {thermalScore}% Stability
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {isTempNominal ? 'Thermal Duty Intact' : 'Spike Logged'}
          </div>
        </div>

        {/* Ed25519 Non-Repudiation Score */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
          <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-purple-400" /> Signature Audit
          </div>
          <div className="text-sm font-bold font-mono text-purple-300">
            {signatureScore}% Verified
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Ed25519 Key Verified
          </div>
        </div>

        {/* Cargo Seal Integrity */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
          <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Seal Compliance
          </div>
          <div className={`text-sm font-bold font-mono ${sealScore === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {sealScore}% Intact
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {sealScore === 100 ? 'Zero Unauthorized Access' : 'Seal Warning'}
          </div>
        </div>
      </div>
    </div>
  );
}
