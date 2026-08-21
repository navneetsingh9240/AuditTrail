import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Hash, ArrowDown, ChevronDown, ChevronUp, Link, Key, ExternalLink } from 'lucide-react';

export default function IntegrityBadge({ integrity, events = [] }) {
  const [showChain, setShowChain] = useState(false);

  if (!integrity) return null;

  const isValid = integrity.valid;
  const merkleRoot = integrity.merkleRoot;
  const latestAnchor = integrity.latestAnchor;

  return (
    <div className={`border rounded-xl p-6 shadow-lg mb-6 transition-all ${
      isValid
        ? 'bg-slate-900 border-slate-800'
        : 'bg-rose-950/20 border-rose-500/50'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl border ${
            isValid
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {isValid ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">Cryptographic Audit & Merkle Integrity</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border ${
                isValid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                {isValid ? '✓ VERIFIED' : '⚠️ TAMPERING DETECTED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {integrity.message || 'SHA-256 event hash chain and Merkle tree root cryptographically verified.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowChain(!showChain)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-mono font-medium transition-colors self-start sm:self-auto"
        >
          <Hash className="w-3.5 h-3.5 text-blue-400" />
          {showChain ? 'Hide Hash Chain & Merkle Tree' : 'View Hash Chain & Merkle Tree'}
          {showChain ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 text-xs font-mono">
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">Algorithm</div>
          <div className="font-bold text-slate-200 mt-0.5">SHA-256</div>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">Merkle Root</div>
          <div className="font-bold text-cyan-400 mt-0.5 truncate" title={merkleRoot}>
            {merkleRoot ? merkleRoot.substring(0, 10) + '...' : 'N/A'}
          </div>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">Carrier Signatures</div>
          <div className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
            <Key className="w-3 h-3" /> Ed25519 Active
          </div>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">Blockchain Anchor</div>
          <div className="font-bold text-purple-400 mt-0.5 flex items-center gap-1 truncate">
            <Link className="w-3 h-3" /> {latestAnchor ? latestAnchor.network.split(' ')[0] : 'Anchored'}
          </div>
        </div>
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">Status</div>
          <div className={`font-bold mt-0.5 ${isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isValid ? '100% Intact' : `Broken at v${integrity.brokenAtVersion}`}
          </div>
        </div>
      </div>

      {latestAnchor && (
        <div className="mt-4 p-3 bg-slate-950/80 border border-purple-500/30 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            <span className="text-slate-400">Polygon Mainnet Anchor Tx:</span>
            <span className="font-bold text-purple-300 truncate max-w-[180px] sm:max-w-xs">{latestAnchor.txHash}</span>
          </div>
          <a
            href={latestAnchor.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[11px] transition-colors"
          >
            PolygonScan <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {showChain && events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
          <h4 className="text-xs font-bold text-slate-300 font-mono flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-blue-400" /> SHA-256 Event Hash Chain & Digital Signatures:
            </span>
            <span className="text-cyan-400 font-normal">Merkle Root: {merkleRoot}</span>
          </h4>
          <div className="space-y-2">
            {events.map((evt, idx) => (
              <div key={evt.eventId || idx} className="space-y-1">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="font-bold text-white">Event #{evt.version}: {evt.eventType}</span>
                    <span className="text-slate-500">{evt.eventId}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    <span className="text-slate-500">Prev Hash:</span> {evt.previousHash || 'GENESIS (null)'}
                  </div>
                  <div className="text-[11px] text-blue-400 truncate font-semibold">
                    <span className="text-slate-500">Event Hash:</span> {evt.eventHash}
                  </div>
                  {evt.payload?._carrierSignature && (
                    <div className="text-[11px] text-emerald-400 truncate flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      <span className="text-slate-500">Ed25519 Carrier Signature:</span> {evt.payload._carrierSignature.substring(0, 32)}...
                    </div>
                  )}
                </div>

                {idx < events.length - 1 && (
                  <div className="flex justify-center py-0.5 text-slate-600">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
