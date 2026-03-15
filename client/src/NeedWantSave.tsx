import React from 'react';

interface DonutProps {
  percentage: number;
  color: string;
  label: string;
  sublabel: string;
}

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DonutChart: React.FC<DonutProps> = ({ percentage, color, label, sublabel }) => {
  const dashOffset = CIRCUMFERENCE * (1 - percentage / 100);

  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ display: 'block', margin: '0 auto' }}>
        {/* Track */}
        <circle cx="36" cy="36" r={RADIUS} fill="none" stroke="var(--sidebar-border)" strokeWidth="8" />
        {/* Progress */}
        <circle
          cx="36"
          cy="36"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        {/* Center text */}
        <text x="36" y="39" textAnchor="middle" fontSize="13" fontWeight="700" fill={color} fontFamily="Inter, sans-serif">
          {percentage}%
        </text>
      </svg>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{sublabel}</div>
    </div>
  );
};

interface NeedWantSaveProps {
  budgetBreakdown?: {
    need?: number;
    want?: number;
    save?: number;
  };
}

const NeedWantSave: React.FC<NeedWantSaveProps> = ({ budgetBreakdown }) => {
  const need = budgetBreakdown?.need ?? 15;
  const want = budgetBreakdown?.want ?? 80;
  const save = budgetBreakdown?.save ?? Math.max(0, 100 - need - want);
  const riskBand = want >= 45 ? 'Critical' : want >= 30 ? 'Medium' : 'Low';

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: '20px',
      border: '1px solid var(--card-border)',
      padding: '24px 32px',
      boxShadow: 'var(--card-shadow)',
      backdropFilter: 'var(--apple-blur)',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: '24px' }}>
        Spending Methodology Analysis
      </div>

      {/* Donut Charts Row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '24px' }}>
        <DonutChart percentage={need} color="var(--apple-blue)" label="ESSENTIAL" sublabel="Standard Need" />
        <DonutChart percentage={want} color="var(--risk-high)" label="ANOMALOUS" sublabel="High-Risk Want" />
        <DonutChart percentage={save} color="var(--risk-low)" label="RESERVE" sublabel="Savings" />
      </div>

      {/* Warning Label */}
      <div style={{
        background: 'var(--risk-high-bg)',
        border: '1px solid var(--risk-high-border)',
        borderRadius: '16px',
        padding: '12px 16px',
        fontSize: '12px',
        color: 'var(--risk-high)',
        lineHeight: 1.5,
        fontWeight: 500,
      }}>
        {riskBand} Analysis: <strong style={{ fontWeight: 800 }}>{want}%</strong> of budget is in
        <strong style={{ fontWeight: 800 }}> &ldquo;Anomalous&rdquo; </strong>
        spend, while savings remain <strong style={{ fontWeight: 800 }}>{save}%</strong>.
      </div>
    </div>
  );
};

export default NeedWantSave;
