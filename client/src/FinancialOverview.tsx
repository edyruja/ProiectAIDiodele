import React from 'react';

interface Metric {
  label: string;
  value: string;
  delta: string;
  deltaPositive: boolean | null; // null = neutral
  subLabel?: string;
  subLabelColor?: string;
}

const metrics: Metric[][] = [
  [
    { label: 'Monthly Income', value: '$14,500', delta: '+2.4%', deltaPositive: true },
    { label: 'Monthly Spending', value: '$38,100', delta: '+145%', deltaPositive: false, subLabel: 'Anomaly Detected', subLabelColor: '#ef4444' },
    { label: 'Net Cash Flow', value: '-$23,600', delta: '-310%', deltaPositive: false },
    { label: 'Carbon Footprint', value: '687.15 kg', delta: '-5.2%', deltaPositive: true },
  ],
  [
    { label: 'Avg Income (6M)', value: '$14,200', delta: 'Stable baseline', deltaPositive: null },
    { label: 'Avg Spending (6M)', value: '$12,800', delta: 'Anomaly Detected', deltaPositive: false, subLabelColor: '#ef4444' },
    { label: 'Spending Median', value: '$11,500', delta: '+1.2%', deltaPositive: true },
    { label: 'Monthly Buffer', value: '-$23,600', delta: 'Depleted', deltaPositive: false, subLabel: 'Depleted', subLabelColor: '#ef4444' },
  ],
];

const TrendUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const TrendDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
);

const DBIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5V19A9 3 0 0 0 21 19V5"/>
    <path d="M3 12A9 3 0 0 0 21 12"/>
  </svg>
);

const FinancialOverview: React.FC = () => {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #e4e9f2',
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <span style={{ color: '#6b7280' }}><DBIcon /></span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          PostgreSQL Financial Overview
        </span>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {metrics.map((row, rowIdx) => (
          <div key={rowIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {row.map((metric, idx) => (
              <MetricCard key={idx} metric={metric} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ metric: Metric }> = ({ metric }) => {
  const isNegativeValue = metric.value.startsWith('-');
  const valueColor = isNegativeValue ? '#ef4444' : '#0f1117';

  const getDeltaColor = () => {
    if (metric.deltaPositive === null) return '#6b7280';
    return metric.deltaPositive ? '#10b981' : '#ef4444';
  };

  const deltaColor = getDeltaColor();

  return (
    <div>
      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontWeight: 400 }}>{metric.label}</div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: valueColor, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '4px' }}>
        {metric.value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: deltaColor, fontSize: '11px', fontWeight: 500 }}>
        {metric.deltaPositive === true && <TrendUpIcon />}
        {metric.deltaPositive === false && <TrendDownIcon />}
        <span>{metric.delta}</span>
      </div>
    </div>
  );
};

export default FinancialOverview;
