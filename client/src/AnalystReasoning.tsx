import React from 'react';

interface ReasoningStep {
  id: number;
  text: React.ReactNode;
}

const steps: ReasoningStep[] = [
  {
    id: 1,
    text: (
      <>Tool <span style={{ color: '#60a5fa', fontWeight: 600 }}>GoogleMapsAPI</span> called. Address located at 4421 Valid St.</>
    ),
  },
  {
    id: 2,
    text: (
      <>Address cross-referenced. Location belongs to a{' '}
        <span style={{ color: '#fb923c', fontWeight: 600 }}>residential apartment building</span>.</>
    ),
  },
  {
    id: 3,
    text: (
      <>Tool <span style={{ color: '#60a5fa', fontWeight: 600 }}>OpenCorporatesAPI</span> called. Company NAICS code declares{' '}
        <span style={{ color: '#fb923c', fontWeight: 600 }}>large-scale industrial production</span>.</>
    ),
  },
  {
    id: 4,
    text: (
      <><span style={{ color: '#f87171', fontWeight: 700 }}>Logical contradiction detected.</span></>
    ),
  },
  {
    id: 5,
    text: (
      <>Sanctions list cross-check: Entity found in <span style={{ color: '#f87171', fontWeight: 600 }}>OFAC SDN List</span>.</>
    ),
  },
  {
    id: 6,
    text: (
      <>Conclusion: <span style={{ color: '#f87171', fontWeight: 700 }}>HIGH RISK — Shell Company Pattern Confirmed.</span></>
    ),
  },
];

const ModelBadge: React.FC = () => (
  <div style={{
    background: '#2a3a52',
    border: '1px solid #3b5070',
    borderRadius: '6px',
    padding: '3px 8px',
    fontSize: '10px',
    fontWeight: 600,
    color: '#93c5fd',
    letterSpacing: '0.02em',
    flexShrink: 0,
  }}>
    Llama 3 70B
  </div>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
);

interface AnalystReasoningProps {
  chainOfThought?: string;
}

const AnalystReasoning: React.FC<AnalystReasoningProps> = ({ chainOfThought }) => {
  // If real data provided by backend, parse it into steps; otherwise use demo steps
  const renderSteps = () => {
    if (chainOfThought) {
      const lines = chainOfThought.split('\n').filter(l => l.trim());
      return lines.map((line, i) => (
        <StepRow key={i} id={i + 1} text={<>{line}</>} />
      ));
    }
    return steps.map(step => <StepRow key={step.id} id={step.id} text={step.text} />);
  };

  return (
    <div style={{
      background: 'var(--analyst-bg)',
      borderRadius: '12px',
      border: '1px solid var(--analyst-border)',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', flexShrink: 0, marginTop: '2px',
            background: '#2a3a52', borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#60a5fa',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <div>
            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>Analyst Agent Reasoning</div>
          </div>
        </div>
        <ModelBadge />
      </div>

      {/* CoT Label */}
      <div style={{ color: '#4a90d9', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '14px' }}>
        Chain of Thought Execution:
      </div>

      {/* Steps */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }} className="scrollbar-thin">
        {renderSteps()}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--analyst-border)', display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{
          background: 'transparent',
          border: '1px solid #2a3a52',
          borderRadius: '6px',
          padding: '5px 10px',
          color: '#8892a4',
          fontSize: '11px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}>
          <CopyIcon />
          Copy Trace
        </button>
      </div>
    </div>
  );
};

const StepRow: React.FC<{ id: number; text: React.ReactNode }> = ({ id, text }) => (
  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
    <div style={{
      width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
      background: '#2a3a52',
      border: '1px solid #3b5070',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '9px', fontWeight: 700, color: '#60a5fa',
    }}>
      {id}
    </div>
    <p style={{ margin: 0, fontSize: '12px', color: 'var(--analyst-text)', lineHeight: 1.6 }}>
      {text}
    </p>
  </div>
);

export default AnalystReasoning;
