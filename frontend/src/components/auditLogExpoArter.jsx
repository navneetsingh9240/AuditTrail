import React from 'react';
import { Download, FileText, FileSpreadsheet, Shield } from 'lucide-react';

export default function AuditLogExporter({ events = [], containerId }) {
  if (!events || events.length === 0) return null;

  const downloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `AuditTrail_${containerId}_EventLedger.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const downloadCSV = () => {
    const headers = ['Event ID', 'Version', 'Timestamp', 'Event Type', 'Aggregate ID', 'Event Hash', 'Previous Hash'];
    const rows = events.map((e) => [
      e.eventId,
      e.version,
      new Date(e.timestamp).toISOString(),
      e.eventType,
      e.aggregateId,
      e.eventHash || 'N/A',
      e.previousHash || 'GENESIS',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.map((field) => `"${field}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AuditTrail_${containerId}_EventLedger.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            Audit Ledger Export Engine
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Download cryptographic proof-of-transit logs for compliance and regulatory reporting.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={downloadCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
        </button>

        <button
          onClick={downloadJSON}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-blue-400" /> Export JSON
        </button>
      </div>
    </div>
  );
}
