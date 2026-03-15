import React from 'react';

interface TopBarProps {
  entityName: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  onHITLConfirm?: () => void;
  children?: React.ReactNode;
}

const riskConfig: Record<string, any> = {
  HIGH: { label: 'HIGH RISK', bg: 'var(--risk-high-bg)', border: 'var(--risk-high-border)', text: 'var(--risk-high)', dot: 'var(--risk-high)' },
  CRITICAL: { label: 'CRITICAL', bg: 'var(--risk-high-bg)', border: 'var(--risk-high-border)', text: 'var(--risk-high)', dot: 'var(--risk-high)' },
  MEDIUM: { label: 'MEDIUM RISK', bg: 'var(--risk-medium-bg)', border: 'rgba(255, 149, 0, 0.2)', text: 'var(--risk-medium)', dot: 'var(--risk-medium)' },
  LOW: { label: 'LOW RISK', bg: 'var(--risk-low-bg)', border: 'var(--risk-low-border)', text: 'var(--risk-low)', dot: 'var(--risk-low)' },
};

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const TopBar: React.FC<TopBarProps> = ({
  entityName,
  riskLevel,
  onHITLConfirm,
  children,
}) => {
  const normalizedLevel = (riskLevel || 'LOW').toUpperCase();
  const risk = riskConfig[normalizedLevel] || riskConfig.LOW;

  return (
    <header style={{
      background: 'var(--apple-bg-dark)',
      backdropFilter: 'var(--apple-blur)',
      borderBottom: '1px solid var(--sidebar-border)',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      height: '72px',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {/* Left spacer keeps entity/risk/actions in the same visual position */}
      <div style={{ flex: 1 }} />

      {/* Entity Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Entity:</span>
        <div style={{
          background: 'rgba(0, 122, 255, 0.1)',
          borderRadius: '20px',
          padding: '6px 14px',
          color: 'var(--apple-blue)',
          fontSize: '12px',
          fontWeight: 600,
          border: '1px solid rgba(0, 122, 255, 0.2)',
        }}>
          {entityName || 'NO ENTITY SELECTED'}
        </div>
      </div>

      {/* Risk Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: risk.bg,
        borderRadius: '20px',
        padding: '6px 14px',
        color: risk.text,
        fontSize: '12px',
        fontWeight: 600,
        border: `1px solid ${risk.border}`,
      }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: risk.dot, display: 'inline-block',
          animation: 'status-pulse 1.5s infinite',
          boxShadow: `0 0 8px ${risk.dot}`,
        }} />
        {risk.label}
      </div>

      {/* Actions */}
      <button
        onClick={onHITLConfirm}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 20px',
          borderRadius: '20px',
          border: 'none',
          background: 'linear-gradient(135deg, #007aff, #0051d7)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,122,255,0.3)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,122,255,0.4)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,122,255,0.3)';
        }}
      >
        <CheckIcon />
        Confirm
      </button>

      {children}
    </header>
  );
};

export default TopBar;
