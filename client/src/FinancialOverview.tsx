import React from 'react';

interface Metric {
  label: string;
  value: string;
  delta: string;
  deltaPositive: boolean | null; // null = neutral
  subLabel?: string;
  subLabelColor?: string;
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

interface FinancialOverviewProps {
  companyData?: {
    revenue?: number;
    average_monthly_spend?: number;
  } | null;
  companies?: Array<{
    revenue?: number;
    average_monthly_spend?: number;
  }>;
}

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const formatMoney = (value: number): string => {
  const absolute = Math.round(Math.abs(value));
  const formatted = '$' + absolute.toLocaleString('en-US');
  return value < 0 ? `-${formatted}` : formatted;
};

const FinancialOverview: React.FC<FinancialOverviewProps> = ({ companyData, companies = [] }) => {
  const monthlyIncome = (companyData?.revenue || 0) / 12;
  const monthlySpend = companyData?.average_monthly_spend || 0;
  const netCashFlow = monthlyIncome - monthlySpend;

  const datasetIncomes = companies
    .map((company) => (company.revenue || 0) / 12)
    .filter((value) => value > 0);
  const datasetSpends = companies
    .map((company) => company.average_monthly_spend || 0)
    .filter((value) => value > 0);

  const avgIncome = datasetIncomes.length
    ? datasetIncomes.reduce((acc, value) => acc + value, 0) / datasetIncomes.length
    : monthlyIncome;
  const avgSpend = datasetSpends.length
    ? datasetSpends.reduce((acc, value) => acc + value, 0) / datasetSpends.length
    : monthlySpend;
  const spendingMedian = datasetSpends.length ? median(datasetSpends) : monthlySpend;

  const safePctDelta = (value: number, baseline: number): number => {
    if (!baseline) return 0;
    return ((value - baseline) / baseline) * 100;
  };

  const incomeDelta = safePctDelta(monthlyIncome, avgIncome);
  const spendingDelta = safePctDelta(monthlySpend, avgSpend);

  const metrics: Metric[][] = [
    [
      {
        label: 'Monthly Income',
        value: formatMoney(monthlyIncome),
        delta: `${incomeDelta >= 0 ? '+' : ''}${Math.round(incomeDelta)}%`,
        deltaPositive: incomeDelta >= 0,
      },
      {
        label: 'Monthly Spending',
        value: formatMoney(monthlySpend),
        delta: `${spendingDelta >= 0 ? '+' : ''}${Math.round(spendingDelta)}%`,
        deltaPositive: spendingDelta < 30,
        subLabel: monthlySpend > monthlyIncome ? 'Anomaly Detected' : undefined,
        subLabelColor: '#ef4444',
      },
      {
        label: 'Net Cash Flow',
        value: formatMoney(netCashFlow),
        delta: `${netCashFlow >= 0 ? '+' : ''}${Math.round(safePctDelta(netCashFlow, avgIncome || 1))}%`,
        deltaPositive: netCashFlow >= 0,
      },
    ],
    [
      {
        label: 'Avg Income (50 Mock)',
        value: formatMoney(avgIncome),
        delta: 'Dataset baseline',
        deltaPositive: null,
      },
      {
        label: 'Avg Spending (50 Mock)',
        value: formatMoney(avgSpend),
        delta: monthlySpend > avgSpend ? 'Above average' : 'Within average',
        deltaPositive: monthlySpend <= avgSpend,
        subLabelColor: '#ef4444',
      },
      {
        label: 'Spending Median',
        value: formatMoney(spendingMedian),
        delta: `${datasetSpends.length} records`,
        deltaPositive: null,
      },
    ],
  ];

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: '20px',
      border: '1px solid var(--card-border)',
      padding: '32px',
      boxShadow: 'var(--card-shadow)',
      backdropFilter: 'var(--apple-blur)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
        <div style={{ color: 'var(--apple-blue)', background: 'rgba(0,122,255,0.05)', padding: '6px', borderRadius: '8px' }}>
          <DBIcon />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          Financial Overview Context
        </span>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {metrics.map((row, rowIdx) => (
          <div key={rowIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
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
  const valueColor = isNegativeValue ? 'var(--risk-high)' : 'var(--text-primary)';

  const getDeltaColor = () => {
    if (metric.deltaPositive === null) return 'var(--text-secondary)';
    return metric.deltaPositive ? 'var(--risk-low)' : 'var(--risk-high)';
  };

  const deltaColor = getDeltaColor();

  return (
    <div className="flex flex-col gap-1">
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '-0.01em' }}>{metric.label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: valueColor, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
        {metric.value}
      </div>
      <div style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '4px', 
        color: deltaColor, 
        fontSize: '13px', 
        fontWeight: 600,
        marginTop: '2px'
      }}>
        <div style={{ opacity: 0.8 }}>
          {metric.deltaPositive === true && <TrendUpIcon />}
          {metric.deltaPositive === false && <TrendDownIcon />}
        </div>
        <span>{metric.delta}</span>
      </div>
      {metric.subLabel && (
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 600, 
          color: metric.subLabelColor || '#86868b',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginTop: '4px'
        }}>
          {metric.subLabel}
        </div>
      )}
    </div>
  );
};

export default FinancialOverview;
