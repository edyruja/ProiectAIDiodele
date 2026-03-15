import React from 'react';

interface PaymentChannel {
  name: string;
  pct: number;
  color: string;
}

const paymentChannels: PaymentChannel[] = [
  { name: 'POS (Point of Sale)', pct: 18, color: '#007aff' },
  { name: 'Offshore', pct: 41, color: '#ff3b30' },
  { name: 'Crypto Exchanges', pct: 28, color: '#ff9500' },
  { name: 'Wire Transfer (EU)', pct: 13, color: '#34c759' },
];

const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

const toSvgPath = (points: number[], width: number, height: number): string => {
  const xStep = width / (points.length - 1);
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * xStep} ${height - (p / 100) * height}`)
    .join(' ');
};

interface TransactionAnalyticsProps {
  companyData?: {
    revenue?: number;
    average_monthly_spend?: number;
    expense_categories?: Record<string, number>;
  } | null;
  companies?: Array<{
    revenue?: number;
    average_monthly_spend?: number;
  }>;
}

const TransactionAnalytics: React.FC<TransactionAnalyticsProps> = ({ companyData, companies = [] }) => {
  const W = 300;
  const H = 110;
  const baseIncome = (companyData?.revenue || 0) / 12;
  const baseSpend = companyData?.average_monthly_spend || 0;
  const fallbackIncomes = companies.map((company) => (company.revenue || 0) / 12).filter((value) => value > 0);
  const fallbackSpends = companies.map((company) => company.average_monthly_spend || 0).filter((value) => value > 0);

  const baselineIncome = baseIncome || (fallbackIncomes[0] || 12000);
  const baselineSpend = baseSpend || (fallbackSpends[0] || 9000);

  const companySeed = (companyData?.expense_categories ? Object.keys(companyData.expense_categories).join('') : 'seed')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const volatility = ((companySeed % 9) + 3) / 100;
  const riskPressure = Math.min(0.25, (baselineSpend / Math.max(baselineIncome, 1)) * 0.12);

  const monthMultipliers = [0.82, 0.89, 0.93, 1, 1.06, 1.1];

  const generatedIncomePoints = monthMultipliers.map((factor, index) => {
    const wobble = 1 + (index % 2 === 0 ? volatility : -volatility * 0.6);
    return baselineIncome * factor * wobble;
  });
  const generatedSpendingPoints = monthMultipliers.map((factor, index) => {
    const stressCurve = 1 + riskPressure + index * 0.01;
    const wobble = 1 + (index % 2 === 0 ? -volatility * 0.4 : volatility * 0.7);
    return baselineSpend * factor * stressCurve * wobble;
  });

  const allPoints = [...generatedIncomePoints, ...generatedSpendingPoints];
  const minPoint = Math.min(...allPoints);
  const maxPoint = Math.max(...allPoints);
  const scaleToPercent = (value: number) => {
    if (maxPoint === minPoint) {
      return 50;
    }
    return ((value - minPoint) / (maxPoint - minPoint)) * 90 + 5;
  };

  const incomeSeries = generatedIncomePoints.map(scaleToPercent);
  const spendingSeries = generatedSpendingPoints.map(scaleToPercent);
  const incomePath = toSvgPath(incomeSeries, W, H);
  const spendingPath = toSvgPath(spendingSeries, W, H);

  // Area fill path
  const incomeArea = `${incomePath} L ${W} ${H} L 0 ${H} Z`;
  const spendingArea = `${spendingPath} L ${W} ${H} L 0 ${H} Z`;

  const channels = companyData?.expense_categories
    ? Object.entries(companyData.expense_categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([name, pct], index) => ({
          name,
          pct,
          color: ['#007aff', '#ff3b30', '#ff9500', '#34c759'][index % 4],
        }))
    : paymentChannels;

  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: '20px',
      border: '1px solid var(--card-border)',
      padding: '24px 32px',
      boxShadow: 'var(--card-shadow)',
      display: 'flex',
      flexDirection: 'column',
      backdropFilter: 'var(--apple-blur)',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px', letterSpacing: '-0.01em' }}>
        Transaction Analytics Trend
      </div>

      {/* Legend */}
      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '12px', letterSpacing: '-0.02em' }}>
        Income vs Spending
      </div>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <LegendDot color="var(--apple-blue)" label="Monthly Income" />
        <LegendDot color="var(--apple-blue)" opacity={0.3} label="Monthly Spending" />
      </div>

      {/* SVG Chart */}
      <div style={{ overflowX: 'hidden', marginBottom: '24px' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H + 24}`} style={{ display: 'block' }}>
          {/* Spending area */}
          <path d={spendingArea} fill="var(--apple-blue)" fillOpacity="0.05" />
          {/* Income area */}
          <path d={incomeArea} fill="var(--apple-blue)" fillOpacity="0.08" />
          {/* Spending line */}
          <path d={spendingPath} fill="none" stroke="var(--apple-blue)" strokeOpacity="0.4" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {/* Income line */}
          <path d={incomePath} fill="none" stroke="var(--apple-blue)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

          {/* X-axis labels */}
          {months.map((m, i) => (
            <text
              key={m}
              x={(i / (months.length - 1)) * W}
              y={H + 20}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="var(--text-secondary)"
              fontFamily="Geist Variable, sans-serif"
            >
              {m}
            </text>
          ))}
        </svg>
      </div>

      {/* Payment Channels */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.04em' }}>
          Payment Channel Analysis
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {channels.map(ch => (
            <div key={ch.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: ch.color, flexShrink: 0,
                  boxShadow: `0 0 6px ${ch.color}40`
                }} />
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>{ch.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '80px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden',
                }}>
                  <div style={{ width: `${ch.pct}%`, height: '100%', background: ch.color, borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', width: '32px', textAlign: 'right' }}>{ch.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LegendDot: React.FC<{ color: string; label: string; opacity?: number }> = ({ color, label, opacity = 1 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, opacity }} />
    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</span>
  </div>
);

export default TransactionAnalytics;
