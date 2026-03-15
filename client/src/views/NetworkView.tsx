import React, { useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TopBar from '../TopBar';
import {
  readSelectedCompanyState,
  subscribeSelectedCompanyChanges,
  writeSelectedCompanyState,
} from '../lib/selectedCompany';

// Fullscreen interactive network view for Deep OSINT Investigations
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface CompanyRecord {
  id: number;
  company_name: string;
  country?: string;
  risk_label?: string;
  risk_explanation?: string;
  directors?: string[];
  average_monthly_spend?: number;
}

const NetworkView: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>(() => readSelectedCompanyState().name || '');

  useEffect(() => {
    fetch(`${API_BASE}/mock-companies?limit=50`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to fetch companies');
        }
        const payload = await response.json();
        const items = Array.isArray(payload?.items) ? payload.items : [];
        setCompanies(items);
      })
      .catch(() => {
        setCompanies([]);
      });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeSelectedCompanyChanges((selection) => {
      setSelectedCompanyId(selection.id);
      setSelectedCompanyName(selection.name || '');
    });

    const initialSelection = readSelectedCompanyState();
    setSelectedCompanyId(initialSelection.id);
    setSelectedCompanyName(initialSelection.name || '');

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (companies.length === 0) {
      return;
    }

    const byId =
      selectedCompanyId == null
        ? null
        : companies.find((company) => company.id === selectedCompanyId) || null;

    const normalizedName = selectedCompanyName.trim().toLowerCase();
    const byName =
      !normalizedName
        ? null
        : companies.find((company) => company.company_name.toLowerCase() === normalizedName) ||
          companies.find((company) => company.company_name.toLowerCase().includes(normalizedName)) ||
          null;

    const resolved = byId || byName;
    if (resolved && resolved.id !== selectedCompanyId) {
      setSelectedCompanyId(resolved.id);
    }
  }, [companies, selectedCompanyId, selectedCompanyName]);

  const selectedCompany =
    companies.find((company) => company.id === selectedCompanyId) || null;

  const peers = useMemo(() => {
    if (!selectedCompany) {
      return [] as CompanyRecord[];
    }
    return companies
      .filter((company) => company.id !== selectedCompany.id)
      .filter((company) => {
        if (selectedCompany.country && company.country === selectedCompany.country) {
          return true;
        }
        return company.risk_label === selectedCompany.risk_label;
      })
      .slice(0, 4);
  }, [companies, selectedCompany]);

  const nodes = useMemo(() => {
    if (!selectedCompany) {
      return [] as Node[];
    }

    const mappedNodes: Node[] = [
      {
        id: 'target',
        type: 'input',
        data: {
          label: selectedCompany.company_name,
          details: selectedCompany.risk_explanation || 'Primary investigated entity.',
        },
        position: { x: 420, y: 260 },
        style: {
          background: 'var(--risk-high)',
          color: '#fff',
          fontWeight: 'bold',
          borderRadius: '12px',
          padding: '12px',
          border: 'none',
          boxShadow: '0 8px 24px rgba(255, 59, 48, 0.3)',
        },
      },
    ];

    (selectedCompany.directors || []).slice(0, 4).forEach((director, index) => {
      mappedNodes.push({
        id: `dir-${index}`,
        data: { label: `${director} (Director)`, details: 'Director relationship from DB mock record.' },
        position: { x: 140 + index * 190, y: 90 },
        style: {
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--sidebar-border)',
          borderRadius: '12px',
          padding: '10px',
          color: 'var(--text-primary)',
          backdropFilter: 'blur(10px)',
        },
      });
    });

    peers.forEach((peer, index) => {
      mappedNodes.push({
        id: `peer-${peer.id}`,
        data: {
          label: peer.company_name,
          details: `${peer.country || 'Unknown'} | ${peer.risk_label || 'UNKNOWN'}`,
          companyId: peer.id,
        },
        position: { x: 140 + index * 190, y: 470 },
        style: {
          background: 'var(--risk-medium-bg)',
          border: '1px solid var(--risk-medium-border)',
          borderRadius: '12px',
          padding: '10px',
          color: 'var(--risk-medium)',
          backdropFilter: 'blur(10px)',
          cursor: 'pointer',
        },
      });
    });

    return mappedNodes;
  }, [selectedCompany, peers]);

  const edges = useMemo(() => {
    if (!selectedCompany) {
      return [] as Edge[];
    }
    const mappedEdges: Edge[] = [];

    (selectedCompany.directors || []).slice(0, 4).forEach((_, index) => {
      mappedEdges.push({
        id: `e-dir-${index}`,
        source: `dir-${index}`,
        target: 'target',
        label: 'controls',
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--text-secondary)' },
        style: { stroke: 'var(--text-secondary)', strokeWidth: 1.5 },
      });
    });

    peers.forEach((peer) => {
      mappedEdges.push({
        id: `e-peer-${peer.id}`,
        source: 'target',
        target: `peer-${peer.id}`,
        label: peer.country && selectedCompany.country === peer.country ? 'country peer' : 'risk peer',
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--risk-medium)' },
        animated: true,
        style: { stroke: 'var(--risk-medium)', strokeWidth: 1.8 },
      });
    });

    return mappedEdges;
  }, [selectedCompany, peers]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    const companyId = (node.data as { companyId?: number })?.companyId;
    if (companyId) {
      setSelectedCompanyId(companyId);
      const nextCompany = companies.find((company) => company.id === companyId);
      writeSelectedCompanyState({
        id: companyId,
        name: nextCompany?.company_name || selectedCompanyName,
      });
    }
    setSelectedNode(node);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--main-bg)]">
      <TopBar entityName={selectedCompany?.company_name || selectedCompanyName || 'NETWORK VIEW'} riskLevel={selectedCompany?.risk_label || 'MEDIUM'}>
        <div className="ml-auto flex items-center gap-4 text-sm text-[var(--text-secondary)] font-medium">
          Interactive Canvas Mode
        </div>
      </TopBar>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 h-full w-full">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              fitView
              className="bg-[var(--main-bg)]"
            >
              <Background color="rgba(255,255,255,0.05)" gap={20} size={1} />
              <Controls className="!bg-[var(--card-bg)] !border-[var(--card-border)] !shadow-xl !text-[var(--text-primary)]" />
              <MiniMap 
                nodeStrokeColor={(n) => {
                  if (n.style?.background === 'var(--risk-high)') return 'var(--risk-high)';
                  if (n.style?.background === 'var(--risk-medium-bg)') return 'var(--risk-medium)';
                  return 'var(--sidebar-border)';
                }}
                className="!bg-[var(--card-bg)] !border-[var(--card-border)] !rounded-[16px] !shadow-2xl"
                maskColor="rgba(0,0,0,0.6)"
              />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* Info Panel for clicked Node */}
        <div 
          className={`w-80 bg-[var(--apple-bg-dark)] backdrop-blur-[var(--apple-blur)] border-l border-[var(--sidebar-border)] shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-10 ${selectedNode ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full opacity-0'}`}
        >
          {selectedNode && (
            <div className="p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">Node Details</h3>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-2 rounded-full hover:bg-white/5 text-[var(--text-secondary)] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6 flex-1">
                <div>
                  <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em] mb-2">Entity Name</div>
                  <div className="text-[15px] font-semibold text-[var(--text-primary)] bg-white/5 p-4 rounded-xl border border-white/5 shadow-inner">
                    {selectedNode.data.label as string}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em] mb-2">Intelligence Details</div>
                  <div className="text-[14px] text-[var(--text-primary)] opacity-90 bg-white/5 p-4 rounded-xl border border-white/5 leading-relaxed min-h-[120px]">
                    {selectedNode.data.details as string}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.08em] mb-3">Risk Factors</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.style?.background === 'var(--risk-high)' && (
                       <span className="px-3 py-1 bg-[var(--risk-high-bg)] text-[var(--risk-high)] text-[10px] font-bold uppercase rounded-full border border-[var(--risk-high-border)]">Primary Target</span>
                    )}
                    {selectedNode.style?.background === 'var(--risk-medium-bg)' && (
                       <span className="px-3 py-1 bg-[var(--risk-medium-bg)] text-[var(--risk-medium)] text-[10px] font-bold uppercase rounded-full border border-[var(--risk-medium-border)]">Suspicious Links</span>
                    )}
                    {selectedNode.data.label?.toString().includes('Bank') && (
                       <span className="px-3 py-1 bg-[var(--risk-low-bg)] text-[var(--risk-low)] text-[10px] font-bold uppercase rounded-full border border-[var(--risk-low-border)]">Financial Bridge</span>
                    )}
                    <span className="px-3 py-1 bg-white/5 text-[var(--text-secondary)] text-[10px] font-bold uppercase rounded-full border border-white/10">OSINT Verified</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-auto border-t border-white/5">
                <button className="w-full py-3.5 bg-[var(--apple-blue)] hover:bg-[#0062cc] text-white rounded-xl text-[14px] font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  Expand Investigation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkView;
