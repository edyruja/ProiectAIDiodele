import React, { useState } from 'react';
import TopBar from '../TopBar';
import { Search, Filter, Download } from 'lucide-react';

interface OsintRecord {
  id: string;
  entity: string;
  source: string;
  timestamp: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  findings: string;
}

const mockData: OsintRecord[] = [
  { id: 'OS-8091', entity: 'NEXUS TRADING CORP', source: 'Offshore Leaks Database', timestamp: '2026-03-14T10:23:00Z', confidence: 'HIGH', findings: 'Linked to 3 Cayman Island shell companies.' },
  { id: 'OS-8092', entity: 'Jane Smith', source: 'Global Watchlist', timestamp: '2026-03-14T09:12:00Z', confidence: 'HIGH', findings: 'Flagged PEP (Politically Exposed Person).' },
  { id: 'OS-8093', entity: 'Global Ventures LLC', source: 'Corporate Registry', timestamp: '2026-03-13T14:45:00Z', confidence: 'MEDIUM', findings: 'Registered address matches known virtual office.' },
  { id: 'OS-8094', entity: 'Swiss Bank Sub-Account', source: 'SWIFT Trace', timestamp: '2026-03-12T16:30:00Z', confidence: 'HIGH', findings: 'Received $2.4M from unknown origins.' },
  { id: 'OS-8095', entity: 'John Doe', source: 'Social Media Analysis', timestamp: '2026-03-11T08:15:00Z', confidence: 'LOW', findings: 'No significant negative news found.' },
];

const OsintView: React.FC = () => {
  const [search, setSearch] = useState('');

  const filteredData = mockData.filter(record => 
    record.entity.toLowerCase().includes(search.toLowerCase()) || 
    record.findings.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    // CSV Header
    const headers = ['Record ID', 'Target Entity', 'Source Engine', 'Timestamp', 'Confidence', 'Extracted Intelligence'];
    
    // CSV Rows
    const rows = filteredData.map(record => [
      record.id,
      record.entity,
      record.source,
      record.timestamp,
      record.confidence,
      `"${record.findings.replace(/"/g, '""')}"` // Escape quotes and wrap in quotes
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `osint_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--main-bg)]">
      <TopBar entityName="GLOBAL INTELLIGENCE HUB" riskLevel="MEDIUM">
        <div className="ml-auto flex items-center gap-4 text-sm text-[var(--text-secondary)] font-medium">
          OSINT Data Bridge
        </div>
      </TopBar>

      <div className="flex-1 overflow-auto p-8 scrollbar-thin">
        <div className="max-w-6xl mx-auto">
          {/* Header Area */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-[28px] font-bold text-[var(--text-primary)] tracking-tight">Intelligence Data Vault</h2>
              <p className="text-[14px] text-[var(--text-secondary)] mt-1 opacity-80">Explore raw open-source intelligence and extracted entities.</p>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-5 py-2.5 border border-[var(--sidebar-border)] bg-white/5 backdrop-blur-md rounded-xl text-[13px] font-semibold text-[var(--text-primary)] hover:bg-white/10 transition-all shadow-sm">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--apple-blue)] text-white rounded-xl text-[13px] font-bold hover:bg-[#0062cc] transition-all shadow-lg shadow-blue-500/10 active:scale-95"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8 relative">
            <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50" />
            <input 
              type="text" 
              placeholder="Search intelligence records by entity name or finding..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white/5 border border-[var(--sidebar-border)] rounded-2xl text-[14px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--apple-blue)] focus:border-transparent transition-all shadow-xl placeholder:text-[var(--text-secondary)] placeholder:opacity-40"
            />
          </div>

          {/* Data Table */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-[var(--apple-blur)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.03] border-b border-[var(--card-border)]">
                  <th className="px-8 py-5 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em]">Record ID</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em]">Target Entity</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em]">Source Engine</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em]">Confidence</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em]">Extracted Intelligence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredData.map(record => (
                  <tr key={record.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                    <td className="px-8 py-5 text-[13px] font-mono text-[var(--text-secondary)] opacity-60 whitespace-nowrap">{record.id}</td>
                    <td className="px-8 py-5">
                      <div className="text-[15px] font-bold text-[var(--text-primary)]">{record.entity}</div>
                      <div className="text-[12px] text-[var(--text-secondary)] mt-1 opacity-50">{new Date(record.timestamp).toLocaleString()}</div>
                    </td>
                    <td className="px-8 py-5 text-[13px] text-[var(--text-primary)] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[var(--text-secondary)] text-[11px] font-bold border border-white/5">
                        {record.source}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      {record.confidence === 'HIGH' && <span className="text-[10px] font-bold tracking-wider px-3 py-1 rounded-full bg-[var(--risk-low-bg)] text-[var(--risk-low)] border border-[var(--risk-low-border)]">HIGH</span>}
                      {record.confidence === 'MEDIUM' && <span className="text-[10px] font-bold tracking-wider px-3 py-1 rounded-full bg-[var(--risk-medium-bg)] text-[var(--risk-medium)] border border-[var(--risk-medium-border)]">MEDIUM</span>}
                      {record.confidence === 'LOW' && <span className="text-[10px] font-bold tracking-wider px-3 py-1 rounded-full bg-[var(--risk-high-bg)] text-[var(--risk-high)] border border-[var(--risk-high-border)]">LOW</span>}
                    </td>
                    <td className="px-8 py-5 text-[14px] text-[var(--text-primary)] max-w-md opacity-90">
                      <p className="line-clamp-2 leading-relaxed">{record.findings}</p>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center text-[var(--text-secondary)] opacity-60 text-sm">
                      No intelligence records found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OsintView;
