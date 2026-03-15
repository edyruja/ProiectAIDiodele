import React, { useState } from 'react';
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

// Fullscreen interactive network view for Deep OSINT Investigations
const NetworkView: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const initialNodes: Node[] = [
    {
      id: 'target',
      type: 'input',
      data: { label: 'NEXUS TRADING CORP', details: 'Target Entity. Registered in Delaware.' },
      position: { x: 400, y: 300 },
      style: { background: 'var(--risk-high)', color: '#fff', fontWeight: 'bold', borderRadius: '12px', padding: '12px', border: 'none', boxShadow: '0 8px 24px rgba(255, 59, 48, 0.3)' },
    },
    {
      id: 'dir-1',
      data: { label: 'John Doe (Director)', details: 'CEO since 2019.' },
      position: { x: 200, y: 150 },
      style: { background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--sidebar-border)', borderRadius: '12px', padding: '10px', color: 'var(--text-primary)', backdropFilter: 'blur(10px)' },
    },
    {
      id: 'dir-2',
      data: { label: 'Jane Smith (Director)', details: 'CFO since 2021. Links to offshore accounts.' },
      position: { x: 600, y: 150 },
      style: { background: 'var(--risk-medium-bg)', border: '1px solid var(--risk-medium-border)', borderRadius: '12px', padding: '10px', color: 'var(--risk-medium)', backdropFilter: 'blur(10px)' },
    },
    {
      id: 'shell-1',
      data: { label: 'Global Ventures LLC', details: 'Shell company located in Cayman Islands.' },
      position: { x: 800, y: 50 },
      style: { background: 'var(--risk-high-bg)', border: '1px solid var(--risk-high-border)', borderRadius: '12px', padding: '10px', color: 'var(--risk-high)', backdropFilter: 'blur(10px)' },
    },
    {
      id: 'bank-1',
      type: 'output',
      data: { label: 'Swiss Bank Account', details: 'Large volume of recent suspicious wire transfers.' },
      position: { x: 400, y: 500 },
      style: { background: 'var(--risk-low-bg)', border: '1px solid var(--risk-low-border)', borderRadius: '12px', padding: '10px', color: 'var(--risk-low)', backdropFilter: 'blur(10px)' },
    },
  ];

  const initialEdges: Edge[] = [
    { id: 'e1', source: 'dir-1', target: 'target', label: 'controls', markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--text-secondary)' }, style: { stroke: 'var(--text-secondary)', strokeWidth: 1.5 } },
    { id: 'e2', source: 'dir-2', target: 'target', label: 'controls', markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--text-secondary)' }, style: { stroke: 'var(--text-secondary)', strokeWidth: 1.5 } },
    { id: 'e3', source: 'target', target: 'bank-1', label: 'transfers funds to', markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--risk-high)' }, animated: true, style: { stroke: 'var(--risk-high)', strokeWidth: 2 } },
    { id: 'e4', source: 'dir-2', target: 'shell-1', label: 'owner of', markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--risk-medium)' }, style: { stroke: 'var(--risk-medium)', strokeWidth: 1.5 } },
  ];

  const [nodes] = useState<Node[]>(initialNodes);
  const [edges] = useState<Edge[]>(initialEdges);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--main-bg)]">
      <TopBar entityName="NEXUS TRADING CORP" riskLevel="HIGH">
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
