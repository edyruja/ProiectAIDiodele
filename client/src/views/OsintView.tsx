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

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50">
      <TopBar entityName="GLOBAL INTELLIGENCE HUB" riskLevel="MEDIUM">
        <div className="ml-auto flex items-center gap-4 text-sm text-slate-500 font-medium">
          OSINT Data Bridge
        </div>
      </TopBar>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Area */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Intelligence Data Vault</h2>
              <p className="text-sm text-slate-500 mt-1">Explore raw open-source intelligence and extracted entities.</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6 relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search intelligence records by entity name or finding..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>

          {/* Data Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Record ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Target Entity</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Source Engine</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Confidence</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Extracted Intelligence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 text-sm font-mono text-slate-500 whitespace-nowrap">{record.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{record.entity}</div>
                      <div className="text-xs text-slate-400 mt-1">{new Date(record.timestamp).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                        {record.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.confidence === 'HIGH' && <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">HIGH</span>}
                      {record.confidence === 'MEDIUM' && <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">MEDIUM</span>}
                      {record.confidence === 'LOW' && <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">LOW</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-md">
                      <p className="line-clamp-2 leading-relaxed">{record.findings}</p>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
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
