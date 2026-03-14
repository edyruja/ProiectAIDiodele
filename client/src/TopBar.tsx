import React from 'react';

interface TopBarProps {
  entityName: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  onHITLConfirm?: () => void;
  children?: React.ReactNode;
}

const riskConfig = {
  HIGH: { label: 'HIGH RISK', bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#ef4444' },
  MEDIUM: { label: 'MEDIUM RISK', bg: '#fffbeb', border: '#fde68a', text: '#d97706', dot: '#f59e0b' },
  LOW: { label: 'LOW RISK', bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', dot: '#22c55e' },
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
  const risk = riskConfig[riskLevel];

  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e4e9f2',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      height: '64px',
      flexShrink: 0,
    }}>
      {/* Title */}
      <div style={{ flex: 1 }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f1117', lineHeight: 1.2 }}>
          CDD &amp; OSINT Investigation
        </h1>
      </div>

      {/* Entity Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '11px', color: '#6b7280' }}>Entity:</div>
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '6px',
          padding: '4px 10px',
          color: '#1d4ed8',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}>
          {entityName || 'NO ENTITY SELECTED'}
        </div>
      </div>

      {/* Risk Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: risk.bg,
        border: `1px solid ${risk.border}`,
        borderRadius: '20px',
        padding: '5px 12px',
        color: risk.text,
        fontSize: '11px',
        fontWeight: 700,
      }}>
        <span style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: risk.dot, display: 'inline-block',
          animation: 'status-pulse 1.5s infinite',
        }} />
        {risk.label}
      </div>

      {/* Actions */}      <button
        onClick={onHITLConfirm}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 16px',
          borderRadius: '8px',
          border: 'none',
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <CheckIcon />
        Human-in-the-Loop Confirm
      </button>

      {children}
    </header>
  );
};

export default TopBar;
