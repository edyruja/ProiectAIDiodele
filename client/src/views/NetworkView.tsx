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
      style: { background: '#ef4444', color: '#fff', fontWeight: 'bold', borderRadius: '8px', padding: '12px', border: 'none' },
    },
    {
      id: 'dir-1',
      data: { label: 'John Doe (Director)', details: 'CEO since 2019.' },
      position: { x: 200, y: 150 },
      style: { background: '#f8fafc', border: '2px solid #94a3b8', borderRadius: '8px', padding: '10px' },
    },
    {
      id: 'dir-2',
      data: { label: 'Jane Smith (Director)', details: 'CFO since 2021. Links to offshore accounts.' },
      position: { x: 600, y: 150 },
      style: { background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '8px', padding: '10px' },
    },
    {
      id: 'shell-1',
      data: { label: 'Global Ventures LLC', details: 'Shell company located in Cayman Islands.' },
      position: { x: 800, y: 50 },
      style: { background: '#fef2f2', border: '2px solid #ef4444', borderRadius: '8px', padding: '10px' },
    },
    {
      id: 'bank-1',
      type: 'output',
      data: { label: 'Swiss Bank Account', details: 'Large volume of recent suspicious wire transfers.' },
      position: { x: 400, y: 500 },
      style: { background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '8px', padding: '10px' },
    },
  ];

  const initialEdges: Edge[] = [
    { id: 'e1', source: 'dir-1', target: 'target', label: 'controls', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e2', source: 'dir-2', target: 'target', label: 'controls', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e3', source: 'target', target: 'bank-1', label: 'transfers funds to', markerEnd: { type: MarkerType.ArrowClosed }, animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } },
    { id: 'e4', source: 'dir-2', target: 'shell-1', label: 'owner of', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#f59e0b' } },
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
    <div className="flex flex-col h-screen w-full bg-slate-50">
      <TopBar entityName="NEXUS TRADING CORP" riskLevel="HIGH">
        <div className="ml-auto flex items-center gap-4 text-sm text-slate-500 font-medium">
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
              className="bg-slate-50"
            >
              <Background color="#cbd5e1" gap={20} size={1} />
              <Controls className="bg-white shadow-md border border-slate-200" />
              <MiniMap 
                nodeStrokeColor={(n) => {
                  if (n.style?.background === '#ef4444') return '#b91c1c';
                  if (n.style?.background === '#fffbeb') return '#d97706';
                  return '#94a3b8';
                }}
                className="bg-white border border-slate-200 rounded-lg shadow-sm"
              />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {/* Info Panel for clicked Node */}
        <div 
          className={`w-80 bg-white border-l border-slate-200 shadow-xl transition-all duration-300 ease-in-out z-10 ${selectedNode ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full opacity-0'}`}
        >
          {selectedNode && (
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800">Node Details</h3>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4 flex-1">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Entity Name</div>
                  <div className="text-sm font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedNode.data.label as string}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Intelligence Details</div>
                  <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed min-h-[100px]">
                    {selectedNode.data.details as string}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Risk Factors</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedNode.style?.background === '#ef4444' && (
                       <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-md">Primary Target</span>
                    )}
                    {selectedNode.style?.background === '#fffbeb' && (
                       <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-md">Suspicious Links</span>
                    )}
                    {selectedNode.data.label?.toString().includes('Bank') && (
                       <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-md">Financial Bridge</span>
                    )}
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md">OSINT Verified</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-auto border-t border-slate-100">
                <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors">
                  Expand Connections
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
