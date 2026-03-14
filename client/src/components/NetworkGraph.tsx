import React, { useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface NetworkGraphProps {
  companyName: string;
  directors?: string[];
  address?: string;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ companyName, directors = [], address }) => {
  const nodes = useMemo(() => {
    const initialNodes: Node[] = [
      {
        id: 'main-company',
        type: 'input',
        data: { label: companyName },
        position: { x: 250, y: 5 },
        style: { background: '#3b82f6', color: '#fff', fontWeight: 'bold', borderRadius: '8px', padding: '10px' },
      },
    ];

    // Add director nodes
    directors.forEach((director, index) => {
      initialNodes.push({
        id: `director-${index}`,
        data: { label: `Director: ${director}` },
        position: { x: 100 + index * 300, y: 150 },
        style: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px' },
      });
    });

    // Add address node
    if (address) {
      initialNodes.push({
        id: 'address-node',
        type: 'output',
        data: { label: `Address: ${address}` },
        position: { x: 250, y: 300 },
        style: { background: '#f1f5f9', border: '1px solid #94a3b8', borderRadius: '8px', padding: '10px', fontSize: '12px' },
      });
    }

    return initialNodes;
  }, [companyName, directors, address]);

  const edges = useMemo(() => {
    const initialEdges: Edge[] = [];

    directors.forEach((_, index) => {
      initialEdges.push({
        id: `e-main-director-${index}`,
        source: 'main-company',
        target: `director-${index}`,
        label: 'controlled by',
        markerEnd: { type: MarkerType.ArrowClosed },
      });
    });

    if (address) {
      initialEdges.push({
        id: 'e-main-address',
        source: 'main-company',
        target: 'address-node',
        label: 'registered at',
        markerEnd: { type: MarkerType.ArrowClosed },
      });
    }

    return initialEdges;
  }, [directors, address]);

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: '400px', background: '#fcfcfc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
        >
          <Background color="#aaa" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
};

export default NetworkGraph;
