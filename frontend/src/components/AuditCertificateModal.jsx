import React from 'react';
import { X, ShieldCheck, Download, Printer, Award, CheckCircle2, Lock, Link as LinkIcon, Server } from 'lucide-react';

export default function AuditCertificateModal({ containerState, integrity, events = [], onClose }) {
  if (!containerState) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const merkleRoot = integrity?.merkleRoot || 'N/A';
  const latestAnchor = integrity?.latestAnchor || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 text-slate-200 relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Header Banner */}
        <div className="text-center space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold font-mono uppercase">
            <ShieldCheck className="w-4 h-4" /> Cryptographic Ledger Certificate
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">
            OFFICIAL SUPPLY CHAIN AUDIT CERTIFICATE
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Issued by AuditTrail Engine • SHA-256 Hash Chain Verified • Polygon PoS Anchored
          </p>
        </div>

        {/* Certificate Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Container Identifier</span>
            <span className="text-blue-400 font-bold text-sm">{containerState.containerId}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Cargo Owner / Operator</span>
            <span className="text-slate-200 font-bold">{containerState.owner || 'Global Cargo'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Origin / Destination</span>
            <span className="text-slate-300">{containerState.origin} → {containerState.destination}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Current State & Location</span>
            <span className="text-emerald-400 font-bold">{containerState.status} ({containerState.currentLocation})</span>
          </div>
        </div>

        {/* Forensic Cryptographic Proofs */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase font-mono text-slate-400 flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" /> Cryptographic Integrity Proofs
          </h4>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Immutable Events:</span>
              <span className="font-bold text-white">{events.length} Events (Version v{containerState.currentVersion})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Hash Chain Algorithm:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> SHA-256 Chain Verified
              </span>
            </div>
            <div className="flex flex-col space-y-0.5 pt-1 border-t border-slate-900">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Merkle Tree Root Hash</span>
              <span className="text-purple-300 font-mono text-[11px] truncate bg-slate-900 p-1.5 rounded border border-slate-800/60">
                {merkleRoot}
              </span>
            </div>
            {latestAnchor && (
              <div className="flex flex-col space-y-0.5 pt-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Polygon PoS Anchor Receipt</span>
                <span className="text-blue-300 font-mono text-[11px] truncate bg-slate-900 p-1.5 rounded border border-slate-800/60 flex items-center justify-between">
                  <span>Tx: {latestAnchor.txHash}</span>
                  <span className="text-[10px] text-emerald-400">Block #{latestAnchor.blockNumber}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Certificate Seal & Date */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-left font-mono">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Date of Issuance</div>
            <div className="text-xs font-bold text-slate-300">{currentDate}</div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 text-xs font-bold font-mono">
            <Award className="w-5 h-5 text-purple-400" /> AUDITTRAIL COMPLIANCE SEAL
          </div>
        </div>

        {/* Print / Download Controls */}
        <div className="flex justify-end gap-3 pt-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-md"
          >
            <Printer className="w-4 h-4" /> Print / Export Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
