import React from 'react';

interface Metric {
  label: string;
  value: string;
  delta: string;
  deltaPositive: boolean | null; // null = neutral
  subLabel?: string;
  subLabelColor?: string;
}

interface FinancialOverviewProps {
  companyName: string;
  riskScore?: number;
}

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

const FinancialOverview: React.FC<FinancialOverviewProps> = ({ companyName, riskScore = 0.5 }) => {
  // Deterministic seed based on company name
  const safeName = companyName || 'Unknown';
  const seed = safeName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Calculate dynamic values
  const multiplier = 1 + (seed % 10) / 10; // 1.0 to 1.9
  const baseIncome = 10000 * multiplier;
  
  // Higher risk means spending is unusually high compared to income
  const spendFactor = 0.7 + (riskScore * 1.5); // 0.7 to 2.2
  const baseSpending = baseIncome * spendFactor;
  
  const netCashFlow = baseIncome - baseSpending;
  
  const isHighRisk = riskScore > 0.6;

  const formatCurrency = (val: number) => 
    `${val < 0 ? '-' : ''}$${Math.abs(Math.round(val)).toLocaleString()}`;
    
  // Simulated historical delta
  const incomeDelta = (seed % 15) - 5; // -5 to +9 %
  
  const metrics: Metric[][] = [
    [
      { label: 'Monthly Income', value: formatCurrency(baseIncome), delta: `${incomeDelta > 0 ? '+' : ''}${incomeDelta}%`, deltaPositive: incomeDelta >= 0 },
      { label: 'Monthly Spending', value: formatCurrency(baseSpending), delta: isHighRisk ? '+145%' : '+12%', deltaPositive: false, subLabel: isHighRisk ? 'Anomaly Detected' : undefined, subLabelColor: '#ef4444' },
      { label: 'Net Cash Flow', value: formatCurrency(netCashFlow), delta: netCashFlow < 0 ? '-310%' : '+5%', deltaPositive: netCashFlow >= 0 },
      { label: 'Carbon Footprint', value: `${(seed % 1000) + 100} kg`, delta: '-5.2%', deltaPositive: true },
    ],
    [
      { label: 'Avg Income (6M)', value: formatCurrency(baseIncome * 0.95), delta: 'Stable baseline', deltaPositive: null },
      { label: 'Avg Spending (6M)', value: formatCurrency(baseSpending * (isHighRisk ? 0.4 : 0.9)), delta: isHighRisk ? 'Anomaly Detected' : '+2.1%', deltaPositive: !isHighRisk, subLabelColor: isHighRisk ? '#ef4444' : undefined },
      { label: 'Spending Median', value: formatCurrency(baseSpending * 0.8), delta: '+1.2%', deltaPositive: true },
      { label: 'Monthly Buffer', value: formatCurrency(netCashFlow), delta: netCashFlow < 0 ? 'Depleted' : 'Healthy', deltaPositive: netCashFlow >= 0, subLabel: netCashFlow < 0 ? 'Depleted' : undefined, subLabelColor: netCashFlow < 0 ? '#ef4444' : undefined },
    ],
  ];

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
          PostgreSQL Financial Overview - {safeName}
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
